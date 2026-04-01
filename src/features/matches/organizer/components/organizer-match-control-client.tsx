"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import type { PublicMatchDetail } from "@/src/features/matches/public/queries/get-public-match-detail";
import type { PublicMatchEvent } from "@/src/features/matches/public/queries/get-public-match-events";
import type { TeamRosterData } from "@/src/features/teams/organizer/queries/get-team-roster";
import type { MatchLineupsDerived } from "@/src/features/matches/public/lib/derive-match-lineups";

import {
  setMatchAwardAction,
  updateMatchLiveAction,
  updateMatchResultAction,
  updateMatchStateAction,
} from "@/src/features/matches/organizer/actions/match-actions";
import {
  addMatchEventsAction,
  deleteMatchEventAction,
  syncMatchScoreFromTimelineAction,
  updateMatchEventMinuteAction,
  type OrganizerMatchEventInput,
} from "@/src/features/matches/organizer/actions/match-events-actions";
import {
  autoGenerateMatchLineupAction,
  saveMatchLineupAction,
} from "@/src/features/matches/organizer/actions/lineup-actions";

type MatchEventKind =
  | "goal"
  | "own_goal"
  | "yellow_card"
  | "red_card"
  | "substitution"
  | "team_foul"
  | "penalty_free_kick";

const EVENT_KIND_OPTIONS: Array<{
  value: MatchEventKind;
  label: string;
  icon: string;
  futsalOnly?: boolean;
}> = [
  { value: "goal", label: "Goal", icon: "⚽" },
  { value: "own_goal", label: "Own Goal", icon: "🥅" },
  { value: "yellow_card", label: "Yellow", icon: "🟨" },
  { value: "red_card", label: "Red", icon: "🟥" },
  { value: "substitution", label: "Sub", icon: "🔁" },
  { value: "team_foul", label: "Team Foul", icon: "⚠", futsalOnly: true },
  { value: "penalty_free_kick", label: "Penalty/FK", icon: "🎯", futsalOnly: true },
];

function minuteLabel(minute: number | null) {
  if (minute == null) return "—";
  return `${minute}'`;
}

function eventIcon(eventType: PublicMatchEvent["eventType"]) {
  switch (eventType) {
    case "goal":
      return "⚽";
    case "assist":
      return "🅰";
    case "own_goal":
      return "🥅";
    case "yellow_card":
      return "🟨";
    case "red_card":
      return "🟥";
    case "sub_in":
      return "↪";
    case "sub_out":
      return "↩";
    case "team_foul":
      return "⚠";
    case "penalty_free_kick":
      return "🎯";
    default:
      return "•";
  }
}

function eventLabel(eventType: PublicMatchEvent["eventType"]) {
  switch (eventType) {
    case "goal":
      return "Goal";
    case "assist":
      return "Assist";
    case "own_goal":
      return "Own Goal";
    case "yellow_card":
      return "Yellow Card";
    case "red_card":
      return "Red Card";
    case "sub_in":
      return "Sub In";
    case "sub_out":
      return "Sub Out";
    case "team_foul":
      return "Team Foul";
    case "penalty_free_kick":
      return "Penalty / Free Kick";
    default:
      return "Event";
  }
}

function ToastError({ error }: { error: string }) {
  return (
    <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
      {error}
    </div>
  );
}

export function OrganizerMatchControlClient({
  match,
  events,
  homeRoster,
  awayRoster,
  derivedLineups,
  savedLineups,
  manOfTheMatchPlayerId,
}: {
  match: PublicMatchDetail;
  events: PublicMatchEvent[];
  homeRoster: TeamRosterData | null;
  awayRoster: TeamRosterData | null;
  derivedLineups: MatchLineupsDerived;
  savedLineups: {
    home: {
      starting: Array<{ playerId: string; playerName: string }>;
      substitutes: Array<{ playerId: string; playerName: string }>;
    };
    away: {
      starting: Array<{ playerId: string; playerName: string }>;
      substitutes: Array<{ playerId: string; playerName: string }>;
    };
  };
  manOfTheMatchPlayerId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Score inputs
  const [homeScore, setHomeScore] = useState<number>(match.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState<number>(match.awayScore ?? 0);
  const [liveMinute, setLiveMinute] = useState<string>(
    match.liveMinute != null ? String(match.liveMinute) : ""
  );
  const [autoLiveClock, setAutoLiveClock] = useState<boolean>(match.status === "live");
  const liveMinuteRef = useRef<string>(liveMinute);

  useEffect(() => {
    setHomeScore(match.homeScore ?? 0);
    setAwayScore(match.awayScore ?? 0);
    setLiveMinute(match.liveMinute != null ? String(match.liveMinute) : "");
    setAutoLiveClock(match.status === "live");
  }, [match.homeScore, match.awayScore, match.liveMinute]);

  useEffect(() => {
    liveMinuteRef.current = liveMinute;
  }, [liveMinute]);

  useEffect(() => {
    if (!autoLiveClock || match.status !== "live") return;
    const baseMinute = Number(liveMinute || match.liveMinute || 0);
    if (!Number.isFinite(baseMinute)) return;
    const startedAt = Date.now();
    const t = setInterval(() => {
      const elapsedMinutes = Math.floor((Date.now() - startedAt) / 60000);
      const next = baseMinute + elapsedMinutes;
      setLiveMinute(String(next));
    }, 1000);
    return () => clearInterval(t);
  }, [autoLiveClock, match.liveMinute, match.status]);

  useEffect(() => {
    if (!autoLiveClock || match.status !== "live") return;
    const sync = setInterval(() => {
      const minuteRaw = liveMinuteRef.current;
      const minute = minuteRaw.trim() === "" ? null : Number(minuteRaw);
      if (minute == null || Number.isNaN(minute)) return;
      startTransition(async () => {
        await updateMatchLiveAction({
          tournamentId: match.tournamentId,
          matchId: match.id,
          homeScore,
          awayScore,
          liveMinute: minute,
        });
      });
    }, 60000);
    return () => clearInterval(sync);
  }, [
    autoLiveClock,
    match.status,
    match.tournamentId,
    match.id,
    homeScore,
    awayScore,
    startTransition,
  ]);

  // Event composer
  const allPlayers = useMemo(() => {
    const homePlayers =
      homeRoster?.players.map((p) => ({
        playerId: p.id,
        playerName: p.name,
        teamName: homeRoster.teamName,
      })) ?? [];
    const awayPlayers =
      awayRoster?.players.map((p) => ({
        playerId: p.id,
        playerName: p.name,
        teamName: awayRoster.teamName,
      })) ?? [];

    return [...homePlayers, ...awayPlayers].sort((a, b) =>
      a.playerName.localeCompare(b.playerName),
    );
  }, [homeRoster, awayRoster]);

  const [eventKind, setEventKind] = useState<MatchEventKind>("goal");
  const [minuteInput, setMinuteInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [goalScorerId, setGoalScorerId] = useState<string>("");
  const [goalAssistId, setGoalAssistId] = useState<string>("");

  const [cardPlayerId, setCardPlayerId] = useState<string>("");

  const [subOutId, setSubOutId] = useState<string>("");
  const [subInId, setSubInId] = useState<string>("");
  const [teamEventTeamId, setTeamEventTeamId] = useState<string>("");
  const [periodIndexInput, setPeriodIndexInput] = useState<string>("1");
  const isFutsal = match.tournamentSport.trim().toLowerCase() === "futsal";
  const [editingMinuteByEventId, setEditingMinuteByEventId] = useState<Record<string, string>>({});
  const [motmPlayerId, setMotmPlayerId] = useState<string>(manOfTheMatchPlayerId ?? "");
  const [showAdvancedEventForm, setShowAdvancedEventForm] = useState<boolean>(false);
  const selectedMotmLabel = allPlayers.find((p) => p.playerId === motmPlayerId)?.playerName ?? null;
  const homeTeamPlayers = useMemo(
    () => (homeRoster?.players ?? []).map((p) => ({ id: p.id, name: p.name })),
    [homeRoster],
  );
  const awayTeamPlayers = useMemo(
    () => (awayRoster?.players ?? []).map((p) => ({ id: p.id, name: p.name })),
    [awayRoster],
  );

  // Keep valid minutes as number or null.
  const parsedMinute = useMemo(() => {
    const n = minuteInput.trim() === "" ? null : Number(minuteInput);
    if (n == null) return null;
    if (Number.isNaN(n)) return null;
    return n;
  }, [minuteInput]);

  const canCompose = useMemo(() => {
    if (eventKind === "goal" || eventKind === "own_goal") return Boolean(goalScorerId);
    if (eventKind === "yellow_card" || eventKind === "red_card")
      return Boolean(cardPlayerId);
    if (eventKind === "substitution") return Boolean(subOutId) && Boolean(subInId);
    if (eventKind === "team_foul" || eventKind === "penalty_free_kick") {
      return Boolean(teamEventTeamId);
    }
    return false;
  }, [cardPlayerId, eventKind, goalScorerId, parsedMinute, subInId, subOutId, teamEventTeamId]);

  const resetComposer = () => {
    setError(null);
    setMinuteInput("");
    setGoalScorerId("");
    setGoalAssistId("");
    setCardPlayerId("");
    setSubOutId("");
    setSubInId("");
    setTeamEventTeamId("");
  };

  const [resultStatus, setResultStatus] = useState<"ft" | "completed">("ft");
  const [lineupMode, setLineupMode] = useState<"saved" | "derived">(
    savedLineups.home.starting.length +
      savedLineups.home.substitutes.length +
      savedLineups.away.starting.length +
      savedLineups.away.substitutes.length >
      0
      ? "saved"
      : "derived"
  );
  const [lineupMessage, setLineupMessage] = useState<string | null>(null);
  const [homeRoles, setHomeRoles] = useState<Record<string, "none" | "starting" | "substitute">>({});
  const [awayRoles, setAwayRoles] = useState<Record<string, "none" | "starting" | "substitute">>({});

  useEffect(() => {
    function buildRoles(
      roster: TeamRosterData | null,
      saved: { starting: Array<{ playerId: string }>; substitutes: Array<{ playerId: string }> }
    ) {
      const map: Record<string, "none" | "starting" | "substitute"> = {};
      for (const p of roster?.players ?? []) map[p.id] = "none";
      for (const p of saved.starting) map[p.playerId] = "starting";
      for (const p of saved.substitutes) map[p.playerId] = "substitute";
      return map;
    }
    setHomeRoles(buildRoles(homeRoster, savedLineups.home));
    setAwayRoles(buildRoles(awayRoster, savedLineups.away));
  }, [homeRoster, awayRoster, savedLineups.home, savedLineups.away]);

  const onSetLive = async () => {
    setError(null);
    const minute = liveMinute.trim() === "" ? null : Number(liveMinute);
    if (liveMinute.trim() !== "" && Number.isNaN(minute as number)) {
      return setError("Live minute must be a number (or empty).");
    }

    const res = await updateMatchLiveAction({
      tournamentId: match.tournamentId,
      matchId: match.id,
      homeScore,
      awayScore,
      liveMinute: minute as number | null,
    });
    if (!res.ok) setError(res.error);
    else router.refresh();
  };

  const onSetFinal = async () => {
    setError(null);
    const res = await updateMatchResultAction({
      tournamentId: match.tournamentId,
      matchId: match.id,
      homeScore,
      awayScore,
      status: resultStatus,
    });
    if (!res.ok) setError(res.error);
    else router.refresh();
  };

  const onSetState = (status: "live" | "paused" | "scheduled" | "ft" | "completed") => {
    setError(null);
    if (status === "live") setAutoLiveClock(true);
    else setAutoLiveClock(false);
    const minute = liveMinute.trim() === "" ? null : Number(liveMinute);
    if (liveMinute.trim() !== "" && Number.isNaN(minute as number)) {
      setError("Live minute must be a number (or empty).");
      return;
    }
    startTransition(async () => {
      const res = await updateMatchStateAction({
        tournamentId: match.tournamentId,
        matchId: match.id,
        status,
        liveMinute: minute as number | null,
      });
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  };

  const onAddEvent = () => {
    if (!canCompose) return;
    setError(null);

    const eventsToInsert: OrganizerMatchEventInput[] = [];
    if (eventKind === "goal") {
      eventsToInsert.push({
        eventType: "goal",
        minute: parsedMinute ?? null,
        playerId: goalScorerId,
      });
      if (goalAssistId) {
        eventsToInsert.push({
          eventType: "assist",
          minute: parsedMinute ?? null,
          playerId: goalAssistId,
        });
      }
    } else if (eventKind === "own_goal") {
      eventsToInsert.push({
        eventType: "own_goal",
        minute: parsedMinute ?? null,
        playerId: goalScorerId,
      });
    } else if (eventKind === "yellow_card") {
      eventsToInsert.push({
        eventType: "yellow_card",
        minute: parsedMinute ?? null,
        playerId: cardPlayerId,
      });
    } else if (eventKind === "red_card") {
      eventsToInsert.push({
        eventType: "red_card",
        minute: parsedMinute ?? null,
        playerId: cardPlayerId,
      });
    } else if (eventKind === "substitution") {
      eventsToInsert.push({
        eventType: "sub_out",
        minute: parsedMinute ?? null,
        playerId: subOutId,
      });
      eventsToInsert.push({
        eventType: "sub_in",
        minute: parsedMinute ?? null,
        playerId: subInId,
      });
    } else if (eventKind === "team_foul") {
      eventsToInsert.push({
        eventType: "team_foul",
        minute: parsedMinute ?? null,
        playerId: null,
        teamId: teamEventTeamId,
        periodIndex: Number(periodIndexInput || "1"),
      });
    } else if (eventKind === "penalty_free_kick") {
      eventsToInsert.push({
        eventType: "penalty_free_kick",
        minute: parsedMinute ?? null,
        playerId: null,
        teamId: teamEventTeamId,
        periodIndex: Number(periodIndexInput || "1"),
      });
    }

    startTransition(async () => {
      const res = await addMatchEventsAction({
        tournamentId: match.tournamentId,
        matchId: match.id,
        events: eventsToInsert,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.data) {
        setHomeScore(res.data.homeScore);
        setAwayScore(res.data.awayScore);
      }
      resetComposer();
      router.refresh();
    });
  };

  const onDeleteEvent = (eventId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await deleteMatchEventAction({
        tournamentId: match.tournamentId,
        matchId: match.id,
        eventId,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.data) {
        setHomeScore(res.data.homeScore);
        setAwayScore(res.data.awayScore);
      }
      router.refresh();
    });
  };

  const onUpdateEventMinute = (eventId: string, currentMinute: number | null) => {
    const raw = editingMinuteByEventId[eventId] ?? (currentMinute != null ? String(currentMinute) : "");
    const minute = Number(raw);
    if (!Number.isFinite(minute)) {
      setError("Minute must be a valid number.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateMatchEventMinuteAction({
        tournamentId: match.tournamentId,
        matchId: match.id,
        eventId,
        minute,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.data) {
        setHomeScore(res.data.homeScore);
        setAwayScore(res.data.awayScore);
      }
      router.refresh();
    });
  };

  const onSyncScoreFromTimeline = () => {
    setError(null);
    startTransition(async () => {
      const res = await syncMatchScoreFromTimelineAction({
        tournamentId: match.tournamentId,
        matchId: match.id,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.data) {
        setHomeScore(res.data.homeScore);
        setAwayScore(res.data.awayScore);
      }
      router.refresh();
    });
  };

  const onSaveManOfTheMatch = () => {
    if (!motmPlayerId) {
      setError("Select a player for Man of the Match.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await setMatchAwardAction({
        tournamentId: match.tournamentId,
        matchId: match.id,
        playerId: motmPlayerId,
        awardType: "man_of_the_match",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setLineupMessage("Man of the Match saved.");
      router.refresh();
    });
  };

  const addQuickEvent = (input: {
    eventType: OrganizerMatchEventInput["eventType"];
    team: "home" | "away";
    meta?: Record<string, unknown>;
  }) => {
    const minute = liveMinute.trim() === "" ? null : Number(liveMinute);
    const validMinute = Number.isFinite(minute as number) ? (minute as number) : null;
    const teamId = input.team === "home" ? match.home?.teamId ?? null : match.away?.teamId ?? null;
    const teamPlayers = input.team === "home" ? homeTeamPlayers : awayTeamPlayers;
    const fallbackPlayerId = teamPlayers[0]?.id ?? null;

    const needsPlayer = ["goal", "own_goal", "yellow_card", "red_card"].includes(input.eventType);
    if (needsPlayer && !fallbackPlayerId) {
      setError("No roster player found for this team. Add team roster first.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await addMatchEventsAction({
        tournamentId: match.tournamentId,
        matchId: match.id,
        events: [
          {
            eventType: input.eventType,
            minute: validMinute,
            playerId: needsPlayer ? fallbackPlayerId : null,
            teamId: needsPlayer ? null : teamId,
            periodIndex: null,
            meta: input.meta ?? {},
          },
        ],
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.data) {
        setHomeScore(res.data.homeScore);
        setAwayScore(res.data.awayScore);
      }
      router.refresh();
    });
  };

  const onUndoLastAction = () => {
    const lastEvent = events[events.length - 1];
    if (!lastEvent) return;
    onDeleteEvent(lastEvent.id);
  };

  const nextAction = (() => {
    if (match.status === "scheduled") {
      return {
        title: "Start match",
        description: "Start the match and begin adding timeline events.",
        cta: "Start Match",
        onClick: () => onSetState("live"),
      };
    }
    if (match.status === "live") {
      return {
        title: "Add match events",
        description: "Record goals, cards, substitutions, and keep score synced.",
        cta: "Add Event",
        onClick: () => {
          const timelineSection = document.getElementById("timeline-section");
          timelineSection?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
      };
    }
    if (match.status === "paused") {
      return {
        title: "Resume match",
        description: "Continue this match and keep updating the timeline.",
        cta: "Resume Match",
        onClick: () => onSetState("live"),
      };
    }
    if (match.status === "ft") {
      return {
        title: "Complete match",
        description: "Finalize this match to lock result and continue tournament flow.",
        cta: "Complete Match",
        onClick: () => onSetState("completed"),
      };
    }
    return {
      title: "Match completed",
      description: "Everything is finished. You can review timeline, lineups, and awards.",
      cta: "Completed",
      onClick: () => undefined,
    };
  })();

  const saveTeamLineup = (team: "home" | "away") => {
    const teamId = team === "home" ? match.home?.teamId : match.away?.teamId;
    const roles = team === "home" ? homeRoles : awayRoles;
    if (!teamId) return;
    const entries = Object.entries(roles);
    const startingPlayerIds = entries.filter(([, role]) => role === "starting").map(([id]) => id);
    const substitutePlayerIds = entries.filter(([, role]) => role === "substitute").map(([id]) => id);
    setLineupMessage(null);
    startTransition(async () => {
      const res = await saveMatchLineupAction({
        tournamentId: match.tournamentId,
        matchId: match.id,
        teamId,
        startingPlayerIds,
        substitutePlayerIds,
        source: "manual",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setLineupMode("saved");
      setLineupMessage(`Saved ${team === "home" ? "home" : "away"} lineup (${res.data.saved} players).`);
      router.refresh();
    });
  };

  const autoTeamLineup = (team: "home" | "away") => {
    const teamId = team === "home" ? match.home?.teamId : match.away?.teamId;
    if (!teamId) return;
    setLineupMessage(null);
    startTransition(async () => {
      const res = await autoGenerateMatchLineupAction({
        tournamentId: match.tournamentId,
        matchId: match.id,
        teamId,
        sport: match.tournamentSport,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const setRoles = (prev: Record<string, "none" | "starting" | "substitute">) => {
        const next: Record<string, "none" | "starting" | "substitute"> = {};
        for (const k of Object.keys(prev)) next[k] = "none";
        for (const id of res.data.startingPlayerIds) next[id] = "starting";
        for (const id of res.data.substitutePlayerIds) next[id] = "substitute";
        return next;
      };
      if (team === "home") setHomeRoles((prev) => setRoles(prev));
      else setAwayRoles((prev) => setRoles(prev));
      setLineupMode("saved");
      setLineupMessage(`Auto lineup generated for ${team === "home" ? "home" : "away"} team.`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5 pb-6">
      <header className="mx-auto max-w-7xl px-4 pt-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
          <span className="text-slate-400">Tournament</span>
          <Link
            href={`/organizer/t/${match.tournamentId}`}
            className="font-semibold text-emerald-200 hover:text-emerald-100"
          >
            {match.tournamentName}
          </Link>
          <span className="text-slate-600">·</span>
          <Link
            href={`/organizer/t/${match.tournamentId}/matches`}
            className="text-slate-300 hover:text-white"
          >
            All matches
          </Link>
          <span className="text-slate-600">·</span>
          <Link
            href={`/organizer/t/${match.tournamentId}/standings`}
            className="text-slate-300 hover:text-white"
          >
            Standings
          </Link>
          {match.tournamentSlug ? (
            <>
              <span className="text-slate-600">·</span>
              <Link
                href={`/t/${match.tournamentSlug}/matches`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-200"
              >
                Public schedule ↗
              </Link>
            </>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Match Center</h1>
            <p className="text-sm text-slate-300">
              Simple controls for score, timeline, lineups, and result.
            </p>
            <p className="text-xs text-slate-500">
              Match ID: <span className="font-mono">{match.id}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/organizer/t/${match.tournamentId}/matches`}
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400/30 hover:text-emerald-200"
              >
                ← Back to fixtures
              </Link>
              <Link
                href={`/match/${match.id}`}
                className="inline-flex items-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25"
              >
                Open public match page →
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
            <div className="text-xs font-semibold text-slate-400">Status</div>
            <div className="mt-1 text-sm font-bold text-slate-50">
              {match.status.toUpperCase()}
              {match.status === "live" && match.liveMinute != null ? (
                <span className="ml-2 text-red-200">
                  · {match.liveMinute}'
                </span>
              ) : null}
            </div>
            {match.roundLabel ? (
              <div className="mt-1 text-xs text-slate-400">
                {match.roundLabel}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {error ? (
        <div className="mx-auto max-w-7xl px-4">
          <ToastError error={error} />
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.07] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200/90">
            What to do next
          </p>
          <div className="mt-2 rounded-2xl border border-emerald-300/20 bg-black/10 px-3 py-3">
            <h3 className="text-sm font-semibold text-emerald-100">{nextAction.title}</h3>
            <p className="mt-1 text-xs text-emerald-200/90">{nextAction.description}</p>
            <button
              type="button"
              onClick={nextAction.onClick}
              disabled={pending || nextAction.cta === "Completed"}
              className="mt-3 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {nextAction.cta}
            </button>
          </div>
          <div className="mt-2 grid gap-2 text-xs text-emerald-100 md:grid-cols-5">
            <p className="rounded-2xl border border-emerald-300/20 bg-black/10 px-3 py-2">1. Start match</p>
            <p className="rounded-2xl border border-emerald-300/20 bg-black/10 px-3 py-2">2. Add events</p>
            <p className="rounded-2xl border border-emerald-300/20 bg-black/10 px-3 py-2">3. Check score</p>
            <p className="rounded-2xl border border-emerald-300/20 bg-black/10 px-3 py-2">4. Finish match</p>
            <p className="rounded-2xl border border-emerald-300/20 bg-black/10 px-3 py-2">5. Select MOTM</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_25px_110px_rgba(0,0,0,0.12)]">
            <h2 className="text-sm font-semibold text-slate-50">Scoreboard</h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Goals and own goals from timeline auto-sync here.
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={onSyncScoreFromTimeline}
                className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {pending ? "Syncing…" : "Sync score from timeline"}
              </button>
            <div className="mt-3 grid gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-3">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {match.home?.logoUrl ? (
                          <span className="relative h-7 w-7 overflow-hidden rounded-full border border-white/10">
                            <Image src={match.home.logoUrl} alt={match.home.teamName} fill className="object-cover" sizes="28px" />
                          </span>
                        ) : null}
                        <span className="truncate text-xs font-semibold text-slate-100">{match.home?.teamName ?? "Home"}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black tracking-wide text-white">{homeScore} - {awayScore}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {match.status === "live" ? `${liveMinute || match.liveMinute || 0}' • Live` : match.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className="truncate text-xs font-semibold text-slate-100">{match.away?.teamName ?? "Away"}</span>
                        {match.away?.logoUrl ? (
                          <span className="relative h-7 w-7 overflow-hidden rounded-full border border-white/10">
                            <Image src={match.away.logoUrl} alt={match.away.teamName} fill className="object-cover" sizes="28px" />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-50">
                      {match.home?.teamName ?? "Home"}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">Home</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-20 rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm font-semibold text-slate-50 outline-none focus:border-emerald-400/40"
                      type="number"
                      value={homeScore}
                      onChange={(e) => setHomeScore(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-50">
                      {match.away?.teamName ?? "Away"}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">Away</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-20 rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm font-semibold text-slate-50 outline-none focus:border-emerald-400/40"
                      type="number"
                      value={awayScore}
                      onChange={(e) => setAwayScore(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {match.status === "live" ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold text-slate-400">
                    Live controls
                  </div>
                  <div className="mt-2 grid gap-3">
                  <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-xs font-medium text-slate-300">
                      Auto live clock
                    </span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-emerald-500"
                      checked={autoLiveClock}
                      onChange={(e) => setAutoLiveClock(e.target.checked)}
                    />
                  </label>
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Live minute (e.g. 52)
                      </label>
                      <input
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-red-400/40"
                        inputMode="numeric"
                        type="number"
                        value={liveMinute}
                        onChange={(e) => setLiveMinute(e.target.value)}
                        placeholder="—"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={onSetLive}
                      className="rounded-2xl bg-red-500/15 border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25 disabled:opacity-50"
                    >
                      {pending ? "Saving…" : "Set Live Score"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold text-slate-400">
                    Start match (set status to LIVE)
                  </div>
                  <div className="mt-2 grid gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Live minute (e.g. 1 or 0)
                      </label>
                      <input
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-red-400/40"
                        inputMode="numeric"
                        type="number"
                        value={liveMinute}
                        onChange={(e) => setLiveMinute(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={onSetLive}
                      className="rounded-2xl bg-red-500/15 border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25 disabled:opacity-50"
                    >
                      {pending ? "Saving…" : "Start / Set Live"}
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold text-slate-400">Match state</div>
                <p className="mt-1 text-[11px] text-slate-500">Only valid next actions are shown.</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {match.status === "scheduled" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onSetState("live")}
                      className="col-span-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-50"
                    >
                      Start Match
                    </button>
                  ) : null}
                  {match.status === "live" ? (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onSetState("paused")}
                        className="rounded-2xl border border-amber-400/30 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200 disabled:opacity-50"
                      >
                        Pause
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onSetState("scheduled")}
                        className="rounded-2xl border border-slate-400/30 bg-slate-500/10 px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-50"
                      >
                        Stop
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onSetState("ft")}
                        className="col-span-2 rounded-2xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 disabled:opacity-50"
                      >
                        Finish (FT)
                      </button>
                    </>
                  ) : null}
                  {match.status === "paused" ? (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onSetState("live")}
                        className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-50"
                      >
                        Resume
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onSetState("ft")}
                        className="rounded-2xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 disabled:opacity-50"
                      >
                        Finish
                      </button>
                    </>
                  ) : null}
                  {match.status === "ft" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onSetState("completed")}
                      className="col-span-2 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 disabled:opacity-50"
                    >
                      Complete Match
                    </button>
                  ) : null}
                  {match.status === "completed" ? (
                    <span className="col-span-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-center text-xs font-semibold text-emerald-200">
                      Match Completed
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold text-slate-400">
                  Final result
                </div>
                <div className="mt-2 grid gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Match status
                    </label>
                    <select
                      value={resultStatus}
                      onChange={(e) =>
                        setResultStatus(e.target.value as "ft" | "completed")
                      }
                      className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                    >
                      <option value="ft">FT</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={onSetFinal}
                    className="rounded-2xl bg-emerald-500/15 border border-emerald-400/30 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
                  >
                    {pending ? "Saving…" : "Set Final Score"}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-amber-400/25 bg-amber-500/10 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-amber-200">
                    Match Awards
                  </div>
                  <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
                    Add card
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-amber-100/80">
                  Choose Man of the Match for this match. You can update it anytime.
                </p>
                <div className="mt-2 grid gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Man of the Match player
                    </label>
                    <select
                      value={motmPlayerId}
                      onChange={(e) => setMotmPlayerId(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                    >
                      <option value="">Choose player…</option>
                      {allPlayers.map((p) => (
                        <option key={p.playerId} value={p.playerId}>
                          {p.playerName} ({p.teamName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={pending || !motmPlayerId}
                    onClick={onSaveManOfTheMatch}
                    className="rounded-2xl bg-amber-500/20 border border-amber-300/40 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/30 disabled:opacity-50"
                  >
                    {pending ? "Saving…" : "Save Man of the Match"}
                  </button>
                  {selectedMotmLabel ? (
                    <p className="text-xs text-amber-100/90">
                      Selected: <span className="font-semibold">{selectedMotmLabel}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-400">Quick actions</div>
                  <button
                    type="button"
                    disabled={pending || events.length === 0}
                    onClick={onUndoLastAction}
                    className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    Undo last
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" disabled={pending} onClick={() => addQuickEvent({ eventType: "goal", team: "home" })} className="rounded-2xl border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-50">Goal Home</button>
                  <button type="button" disabled={pending} onClick={() => addQuickEvent({ eventType: "goal", team: "away" })} className="rounded-2xl border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-50">Goal Away</button>
                  <button type="button" disabled={pending} onClick={() => addQuickEvent({ eventType: "yellow_card", team: "home" })} className="rounded-2xl border border-yellow-400/35 bg-yellow-500/15 px-3 py-2 text-xs font-semibold text-yellow-200 disabled:opacity-50">Yellow Home</button>
                  <button type="button" disabled={pending} onClick={() => addQuickEvent({ eventType: "yellow_card", team: "away" })} className="rounded-2xl border border-yellow-400/35 bg-yellow-500/15 px-3 py-2 text-xs font-semibold text-yellow-200 disabled:opacity-50">Yellow Away</button>
                  <button type="button" disabled={pending} onClick={() => addQuickEvent({ eventType: "red_card", team: "home" })} className="rounded-2xl border border-red-400/35 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-200 disabled:opacity-50">Red Home</button>
                  <button type="button" disabled={pending} onClick={() => addQuickEvent({ eventType: "red_card", team: "away" })} className="rounded-2xl border border-red-400/35 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-200 disabled:opacity-50">Red Away</button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setEventKind("substitution");
                      setShowAdvancedEventForm(true);
                    }}
                    className="rounded-2xl border border-cyan-400/35 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-200 disabled:opacity-50"
                  >
                    Substitution
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => addQuickEvent({ eventType: "own_goal", team: "home" })}
                    className="rounded-2xl border border-orange-400/35 bg-orange-500/15 px-3 py-2 text-xs font-semibold text-orange-200 disabled:opacity-50"
                  >
                    Own Goal
                  </button>
                  {isFutsal ? (
                    <>
                      <button type="button" disabled={pending} onClick={() => addQuickEvent({ eventType: "team_foul", team: "home" })} className="rounded-2xl border border-violet-400/35 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200 disabled:opacity-50">Foul Home</button>
                      <button type="button" disabled={pending} onClick={() => addQuickEvent({ eventType: "team_foul", team: "away" })} className="rounded-2xl border border-violet-400/35 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200 disabled:opacity-50">Foul Away</button>
                      <button type="button" disabled={pending} onClick={() => addQuickEvent({ eventType: "penalty_free_kick", team: "home" })} className="rounded-2xl border border-fuchsia-400/35 bg-fuchsia-500/15 px-3 py-2 text-xs font-semibold text-fuchsia-200 disabled:opacity-50">Penalty</button>
                      <button type="button" disabled={pending} onClick={() => addQuickEvent({ eventType: "penalty_free_kick", team: "home", meta: { result: "miss" } })} className="rounded-2xl border border-fuchsia-400/35 bg-fuchsia-500/15 px-3 py-2 text-xs font-semibold text-fuchsia-200 disabled:opacity-50">Penalty Miss</button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-2 space-y-4">
            <details className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_25px_110px_rgba(0,0,0,0.12)]">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">
                Lineups (optional)
              </summary>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-50">Team Lineups</h2>
                <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setLineupMode("saved")}
                    className={`rounded-lg px-2.5 py-1 ${lineupMode === "saved" ? "bg-emerald-500/20 text-emerald-200" : "text-slate-300"}`}
                  >
                    Saved (manual/auto)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLineupMode("derived")}
                    className={`rounded-lg px-2.5 py-1 ${lineupMode === "derived" ? "bg-white/10 text-slate-100" : "text-slate-300"}`}
                  >
                    Derived
                  </button>
                </div>
              </div>
              {lineupMessage ? (
                <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                  {lineupMessage}
                </div>
              ) : null}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <LineupEditorCard
                  title="Home lineup"
                  teamName={match.home?.teamName ?? "Home"}
                  roster={homeRoster}
                  roles={homeRoles}
                  onRoleChange={(playerId, role) =>
                    setHomeRoles((prev) => ({ ...prev, [playerId]: role }))
                  }
                  onAuto={() => autoTeamLineup("home")}
                  onSave={() => saveTeamLineup("home")}
                  pending={pending}
                />
                <LineupEditorCard
                  title="Away lineup"
                  teamName={match.away?.teamName ?? "Away"}
                  roster={awayRoster}
                  roles={awayRoles}
                  onRoleChange={(playerId, role) =>
                    setAwayRoles((prev) => ({ ...prev, [playerId]: role }))
                  }
                  onAuto={() => autoTeamLineup("away")}
                  onSave={() => saveTeamLineup("away")}
                  pending={pending}
                />
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <LineupBlock
                  title={lineupMode === "saved" ? "Home: Starting (saved)" : "Home: Starting (derived)"}
                  teamName={match.home?.teamName ?? "Home"}
                  players={lineupMode === "saved" ? savedLineups.home.starting : derivedLineups.home.starting}
                />
                <LineupBlock
                  title={lineupMode === "saved" ? "Home: Substitutes (saved)" : "Home: Substitutes used"}
                  teamName={match.home?.teamName ?? "Home"}
                  players={lineupMode === "saved" ? savedLineups.home.substitutes : derivedLineups.home.substitutes}
                />
                <LineupBlock
                  title={lineupMode === "saved" ? "Away: Starting (saved)" : "Away: Starting (derived)"}
                  teamName={match.away?.teamName ?? "Away"}
                  players={lineupMode === "saved" ? savedLineups.away.starting : derivedLineups.away.starting}
                />
                <LineupBlock
                  title={lineupMode === "saved" ? "Away: Substitutes (saved)" : "Away: Substitutes used"}
                  teamName={match.away?.teamName ?? "Away"}
                  players={lineupMode === "saved" ? savedLineups.away.substitutes : derivedLineups.away.substitutes}
                />
              </div>
            </details>

            <div id="timeline-section" className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_25px_110px_rgba(0,0,0,0.12)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">Match Events</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Add goals, assists, cards, and substitutions.
                  </p>
                  <p className="mt-2 inline-flex items-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                    Timeline updates auto-sync score, assists, cards, and stats.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => router.refresh()}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400/25 hover:text-emerald-200"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_340px]">
                <div className="space-y-3">
                  {events.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
                      No events yet. Add one below.
                    </div>
                  ) : (
                    events.map((e) => (
                      <div
                        key={e.id}
                        className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{eventIcon(e.eventType)}</span>
                              <span className="text-sm font-semibold text-slate-50">
                                [{minuteLabel(e.minute)}] {eventLabel(e.eventType)}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {e.player?.playerName
                                ? `${e.player.playerName}${e.player.teamName ? ` · ${e.player.teamName}` : ""}`
                                : "Player TBD"}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => onDeleteEvent(e.id)}
                            className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="number"
                            value={
                              editingMinuteByEventId[e.id] ??
                              (e.minute != null ? String(e.minute) : "")
                            }
                            onChange={(ev) =>
                              setEditingMinuteByEventId((prev) => ({
                                ...prev,
                                [e.id]: ev.target.value,
                              }))
                            }
                            className="w-28 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-400/40"
                            placeholder="Minute"
                          />
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => onUpdateEventMinute(e.id, e.minute)}
                            className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            Update minute
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-slate-50">Add Event</h3>
                  <div className="mt-3">
                    <p className="text-[11px] font-medium text-slate-400">Quick choose</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {EVENT_KIND_OPTIONS.filter((opt) => (opt.futsalOnly ? isFutsal : true)).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEventKind(opt.value)}
                          className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                            eventKind === opt.value
                              ? "border-emerald-400/45 bg-emerald-500/20 text-emerald-100"
                              : "border-white/10 bg-white/5 text-slate-300 hover:border-emerald-400/25 hover:text-emerald-200"
                          }`}
                        >
                          <span className="mr-1">{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedEventForm((prev) => !prev)}
                    className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400/25 hover:text-emerald-200"
                  >
                    {showAdvancedEventForm ? "Hide Advanced Event Form" : "Open Advanced Event Form"}
                  </button>
                  {showAdvancedEventForm ? (
                  <div className="mt-3 grid gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Event type (advanced)
                      </label>
                      <select
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                        value={eventKind}
                        onChange={(e) =>
                          setEventKind(e.target.value as MatchEventKind)
                        }
                      >
                        <option value="goal">Goal (+optional assist)</option>
                        <option value="own_goal">Own Goal</option>
                        <option value="yellow_card">Yellow Card</option>
                        <option value="red_card">Red Card</option>
                        <option value="substitution">Substitution</option>
                        {isFutsal ? <option value="team_foul">Team Foul (Futsal)</option> : null}
                        {isFutsal ? (
                          <option value="penalty_free_kick">Penalty/Free Kick (Futsal)</option>
                        ) : null}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Minute (optional)
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={minuteInput}
                        onChange={(e) => setMinuteInput(e.target.value)}
                        placeholder="e.g. 52 (leave empty if unknown)"
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                      />
                    </div>

                    {eventKind === "goal" || eventKind === "own_goal" ? (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-300">
                            {eventKind === "own_goal" ? "Player (own goal)" : "Scorer"}
                          </label>
                          <select
                            value={goalScorerId}
                            onChange={(e) => setGoalScorerId(e.target.value)}
                            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                          >
                            <option value="" disabled>
                              Select scorer…
                            </option>
                            {allPlayers.map((p) => (
                              <option key={p.playerId} value={p.playerId}>
                                {p.playerName} ({p.teamName})
                              </option>
                            ))}
                          </select>
                        </div>

                        {eventKind === "goal" ? (
                          <div>
                            <label className="block text-xs font-medium text-slate-300">
                              Assist (optional)
                            </label>
                            <select
                              value={goalAssistId}
                              onChange={(e) => setGoalAssistId(e.target.value)}
                              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                            >
                              <option value="">No assist</option>
                              {allPlayers.map((p) => (
                                <option key={p.playerId} value={p.playerId}>
                                  {p.playerName} ({p.teamName})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    {eventKind === "yellow_card" || eventKind === "red_card" ? (
                      <div>
                        <label className="block text-xs font-medium text-slate-300">
                          Player
                        </label>
                        <select
                          value={cardPlayerId}
                          onChange={(e) => setCardPlayerId(e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                        >
                          <option value="" disabled>
                            Select player…
                          </option>
                          {allPlayers.map((p) => (
                            <option key={p.playerId} value={p.playerId}>
                              {p.playerName} ({p.teamName})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    {eventKind === "substitution" ? (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-300">
                            Sub out
                          </label>
                          <select
                            value={subOutId}
                            onChange={(e) => setSubOutId(e.target.value)}
                            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                          >
                            <option value="" disabled>
                              Choose player out…
                            </option>
                            {allPlayers.map((p) => (
                              <option key={p.playerId} value={p.playerId}>
                                {p.playerName} ({p.teamName})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300">
                            Sub in
                          </label>
                          <select
                            value={subInId}
                            onChange={(e) => setSubInId(e.target.value)}
                            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                          >
                            <option value="" disabled>
                              Choose player in…
                            </option>
                            {allPlayers.map((p) => (
                              <option key={p.playerId} value={p.playerId}>
                                {p.playerName} ({p.teamName})
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : null}

                    {eventKind === "team_foul" || eventKind === "penalty_free_kick" ? (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-300">
                            Team
                          </label>
                          <select
                            value={teamEventTeamId}
                            onChange={(e) => setTeamEventTeamId(e.target.value)}
                            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                          >
                            <option value="" disabled>
                              Select team…
                            </option>
                            {match.home?.teamId ? (
                              <option value={match.home.teamId}>
                                {match.home.teamName}
                              </option>
                            ) : null}
                            {match.away?.teamId ? (
                              <option value={match.away.teamId}>
                                {match.away.teamName}
                              </option>
                            ) : null}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300">
                            Half / period
                          </label>
                          <input
                            type="number"
                            value={periodIndexInput}
                            onChange={(e) => setPeriodIndexInput(e.target.value)}
                            min={1}
                            max={4}
                            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400/40"
                          />
                        </div>
                      </>
                    ) : null}

                    <button
                      type="button"
                      onClick={onAddEvent}
                      disabled={!canCompose || pending}
                      className="rounded-2xl bg-emerald-500/15 border border-emerald-400/30 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      {pending ? "Saving…" : "Add to Timeline"}
                    </button>

                    {allPlayers.length === 0 ? (
                      <div className="text-xs text-slate-400">
                        No roster players found for these teams. Add roster players first.
                      </div>
                    ) : null}
                  </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <details className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">Match details (advanced)</summary>
          <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            <p><span className="text-slate-500">Tournament:</span> {match.tournamentName}</p>
            <p><span className="text-slate-500">Sport:</span> {match.tournamentSport || "—"}</p>
            <p><span className="text-slate-500">Round:</span> {match.roundLabel || "—"}</p>
            <p><span className="text-slate-500">Scheduled:</span> {match.scheduledAt ? new Date(match.scheduledAt).toLocaleString() : "—"}</p>
            <p><span className="text-slate-500">Match ID:</span> <span className="font-mono text-xs">{match.id}</span></p>
            <p><span className="text-slate-500">Public page:</span> <Link href={`/match/${match.id}`} className="text-emerald-300 hover:text-emerald-200">Open</Link></p>
          </div>
        </details>
      </div>
    </div>
  );
}

function LineupBlock({
  title,
  teamName,
  players,
}: {
  title: string;
  teamName: string;
  players: Array<{ playerId: string; playerName: string }>;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-50">{title}</div>
          <div className="mt-1 text-xs text-slate-400">
            {teamName}
          </div>
        </div>
        <div className="text-xs font-semibold text-slate-200">
          {players.length} players
        </div>
      </div>

      {players.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">
          No lineup data yet.
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {players.map((p) => (
            <Link
              key={p.playerId}
              href={`/player/${p.playerId}`}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400/25 hover:text-emerald-200"
            >
              {p.playerName}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function LineupEditorCard({
  title,
  teamName,
  roster,
  roles,
  onRoleChange,
  onAuto,
  onSave,
  pending,
}: {
  title: string;
  teamName: string;
  roster: TeamRosterData | null;
  roles: Record<string, "none" | "starting" | "substitute">;
  onRoleChange: (playerId: string, role: "none" | "starting" | "substitute") => void;
  onAuto: () => void;
  onSave: () => void;
  pending: boolean;
}) {
  const players = roster?.players ?? [];
  const startingCount = Object.values(roles).filter((r) => r === "starting").length;
  const subCount = Object.values(roles).filter((r) => r === "substitute").length;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          <p className="mt-1 text-xs text-slate-400">
            {teamName} · Starting {startingCount} · Substitutes {subCount}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAuto}
            disabled={pending || players.length === 0}
            className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            Auto
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="rounded-xl border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-100 hover:bg-white/15 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
      {players.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-slate-400">
          No roster players found for this team.
        </div>
      ) : (
        <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-100">{p.name}</div>
                <div className="truncate text-[11px] text-slate-500">
                  {p.position ?? "Position —"}{p.jerseyNumber ? ` · #${p.jerseyNumber}` : ""}
                </div>
              </div>
              <select
                value={roles[p.id] ?? "none"}
                onChange={(e) =>
                  onRoleChange(
                    p.id,
                    (e.target.value as "none" | "starting" | "substitute") ?? "none"
                  )
                }
                className="rounded-xl border border-white/10 bg-slate-950/30 px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-400/40"
              >
                <option value="none">None</option>
                <option value="starting">Starting</option>
                <option value="substitute">Substitute</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

