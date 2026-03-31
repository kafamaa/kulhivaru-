"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { PublicMatchDetail } from "@/src/features/matches/public/queries/get-public-match-detail";
import type { PublicMatchEvent } from "@/src/features/matches/public/queries/get-public-match-events";
import type { TeamRosterData } from "@/src/features/teams/organizer/queries/get-team-roster";
import type { MatchLineupsDerived } from "@/src/features/matches/public/lib/derive-match-lineups";

import {
  updateMatchLiveAction,
  updateMatchResultAction,
  updateMatchStateAction,
} from "@/src/features/matches/organizer/actions/match-actions";
import {
  addMatchEventsAction,
  deleteMatchEventAction,
  updateMatchEventMinuteAction,
  type OrganizerMatchEventInput,
} from "@/src/features/matches/organizer/actions/match-events-actions";

type MatchEventKind =
  | "goal"
  | "own_goal"
  | "yellow_card"
  | "red_card"
  | "substitution"
  | "team_foul"
  | "penalty_free_kick";

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
}: {
  match: PublicMatchDetail;
  events: PublicMatchEvent[];
  homeRoster: TeamRosterData | null;
  awayRoster: TeamRosterData | null;
  derivedLineups: MatchLineupsDerived;
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
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
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
            <h1 className="text-2xl font-semibold">Match control</h1>
            <p className="text-sm text-slate-300">
              Run the match: lineups, live score, events, and final result.
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
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_25px_110px_rgba(0,0,0,0.12)]">
            <h2 className="text-sm font-semibold text-slate-50">Scoreboard</h2>
            <div className="mt-3 grid gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
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
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onSetState("live")}
                    className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-50"
                  >
                    Live
                  </button>
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
                    className="rounded-2xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 disabled:opacity-50"
                  >
                    FT
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onSetState("completed")}
                    className="col-span-2 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 disabled:opacity-50"
                  >
                    Complete
                  </button>
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
            </div>
          </section>

          <section className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_25px_110px_rgba(0,0,0,0.12)]">
              <h2 className="text-sm font-semibold text-slate-50">Lineups / Squad (derived)</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <LineupBlock
                  title="Home: Starting"
                  teamName={match.home?.teamName ?? "Home"}
                  players={derivedLineups.home.starting}
                />
                <LineupBlock
                  title="Home: Substitutes used"
                  teamName={match.home?.teamName ?? "Home"}
                  players={derivedLineups.home.substitutes}
                />
                <LineupBlock
                  title="Away: Starting"
                  teamName={match.away?.teamName ?? "Away"}
                  players={derivedLineups.away.starting}
                />
                <LineupBlock
                  title="Away: Substitutes used"
                  teamName={match.away?.teamName ?? "Away"}
                  players={derivedLineups.away.substitutes}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_25px_110px_rgba(0,0,0,0.12)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">Event Timeline</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Add goals, assists, cards, and substitutions.
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
                  <div className="mt-3 grid gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Event type
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
                </div>
              </div>
            </div>
          </section>
        </div>
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

