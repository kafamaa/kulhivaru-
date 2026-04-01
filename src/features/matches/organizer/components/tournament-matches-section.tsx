"use client";

import { useState } from "react";
import Link from "next/link";
import type { OrganizerTournamentMatchRow, OrganizerTournamentMatchesData } from "../queries/get-tournament-matches";
import { MatchEditorDialog } from "./match-editor-dialog";
import {
  createKnockoutShellFromStandingsAction,
  deleteMatchAction,
  generateNextKnockoutRoundAction,
  generateRoundRobinFixturesAction,
} from "../actions/match-actions";
import { useRouter } from "next/navigation";
import { ManualFixtureCreateCard } from "@/src/features/organizer/components/manual-fixture-create-card";

interface TournamentMatchesSectionProps {
  data: OrganizerTournamentMatchesData;
}

type MatchStateStep = "create" | "schedule" | "results" | "knockout" | "champion";

function isFinishedStatus(status: string): boolean {
  return status === "ft" || status === "completed";
}

function formatSlotLabel(slot: string): string {
  if (slot === "SF1") return "Semi Final 1";
  if (slot === "SF2") return "Semi Final 2";
  if (slot === "F1") return "Final";
  if (slot === "TP1") return "Third Place";
  return slot;
}

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  if (n % 10 === 1) return `${n}st`;
  if (n % 10 === 2) return `${n}nd`;
  if (n % 10 === 3) return `${n}rd`;
  return `${n}th`;
}

function sourceToFriendlyText(source: string | null): string {
  if (!source) return "Waiting for previous result";
  const lower = source.toLowerCase();
  if (lower.startsWith("winner:")) return `Winner of ${source.split(":")[1] ?? "previous match"}`;
  if (lower.startsWith("loser:")) return `Loser of ${source.split(":")[1] ?? "previous match"}`;
  if (lower.startsWith("standing:")) {
    const rank = Number(source.split(":")[1] ?? 0);
    return rank > 0 ? `${ordinal(rank)} place team` : "Standing team";
  }
  if (lower.startsWith("team:")) return "Selected team";
  return "Waiting for previous result";
}

export function TournamentMatchesSection({ data }: TournamentMatchesSectionProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<OrganizerTournamentMatchRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingKnockout, setGeneratingKnockout] = useState(false);
  const [creatingKnockoutShell, setCreatingKnockoutShell] = useState(false);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
  const [knockoutStartRound, setKnockoutStartRound] = useState<"QF" | "SF" | "F">("SF");
  const [pairingMode, setPairingMode] = useState<"auto" | "manual" | "hybrid">("hybrid");
  const [qualifiedCount, setQualifiedCount] = useState("4");
  const [includeThirdPlace, setIncludeThirdPlace] = useState(true);
  const hasMatches = data.matches.length > 0;
  const completedCount = data.matches.filter((m) => isFinishedStatus(m.status)).length;
  const hasKnockoutSlots = data.matches.some((m) => Boolean(m.slotCode));
  const remainingCount = data.matches.length - completedCount;
  const sortedMatches = [...data.matches].sort((a, b) => {
    const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
  const unscheduledMatches = data.matches.filter((m) => !m.scheduledAt);
  const waitingResultMatches = data.matches.filter(
    (m) => m.scheduledAt && !isFinishedStatus(m.status),
  );
  const firstUnscheduledMatch = unscheduledMatches[0] ?? null;
  const firstResultPendingMatch =
    waitingResultMatches.find((m) => !m.slotCode) ?? waitingResultMatches[0] ?? null;
  const groupStageMatches = data.matches.filter((m) => !m.slotCode);
  const groupStageComplete =
    groupStageMatches.length > 0 && groupStageMatches.every((m) => isFinishedStatus(m.status));
  const knockoutReady = groupStageComplete && !hasKnockoutSlots;
  const finalMatch = data.matches.find((m) => m.slotCode === "F1");
  const finalCompleted = Boolean(finalMatch && isFinishedStatus(finalMatch.status));

  const nextStep: {
    step: MatchStateStep;
    title: string;
    description: string;
    cta: string;
    onClick: () => void;
    disabled?: boolean;
  } = (() => {
    if (!hasMatches) {
      return {
        step: "create",
        title: "Step 1: Create first-stage matches",
        description: "No matches yet. Start by creating group/league fixtures.",
        cta: generating ? "Creating..." : "Create Group Matches",
        onClick: () => void generate(),
        disabled: generating,
      };
    }
    if (unscheduledMatches.length > 0) {
      return {
        step: "schedule",
        title: "Step 2: Set match dates and times",
        description: `${unscheduledMatches.length} match(es) still need schedule.`,
        cta: "Schedule Matches",
        onClick: () => {
          if (firstUnscheduledMatch) openEditor(firstUnscheduledMatch);
        },
      };
    }
    if (waitingResultMatches.length > 0) {
      return {
        step: "results",
        title: "Step 3: Enter match results",
        description: `${waitingResultMatches.length} match(es) waiting for result.`,
        cta: "Enter Results",
        onClick: () => {
          if (firstResultPendingMatch) router.push(`/organizer/match/${firstResultPendingMatch.id}`);
        },
      };
    }
    if (knockoutReady) {
      return {
        step: "knockout",
        title: "Step 4: Generate knockout round",
        description: "Group stage is complete. Create the next knockout matches.",
        cta: generatingKnockout ? "Creating..." : "Create Next Round",
        onClick: () => void autoCreateKnockout(),
        disabled: generatingKnockout,
      };
    }
    if (finalCompleted || data.championTeamName) {
      return {
        step: "champion",
        title: "Tournament finished",
        description: data.championTeamName
          ? `Champion: ${data.championTeamName}`
          : "Final is completed.",
        cta: "View Awards",
        onClick: () => router.push(`/organizer/t/${data.tournamentId}/awards`),
      };
    }
    return {
      step: "results",
      title: "Step 3: Continue entering results",
      description: "Matches are in progress. Keep updating results.",
      cta: "Enter Results",
      onClick: () => {
        if (firstResultPendingMatch) router.push(`/organizer/match/${firstResultPendingMatch.id}`);
      },
    };
  })();

  const openEditor = (m: OrganizerTournamentMatchRow) => {
    setEditing(m);
    setEditorOpen(true);
  };

  const show = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const generate = async () => {
    if (!confirm("Generate round robin fixtures for approved teams? This will create matches (unscheduled).")) return;
    setGenerating(true);
    const res = await generateRoundRobinFixturesAction({ tournamentId: data.tournamentId });
    setGenerating(false);
    if (res.ok) {
      show("success", "Fixtures generated.");
      router.refresh();
    } else {
      show("error", res.error);
    }
  };

  const autoCreateKnockout = async () => {
    setGeneratingKnockout(true);
    const res = await generateNextKnockoutRoundAction({
      tournamentId: data.tournamentId,
      includeThirdPlace: true,
    });
    setGeneratingKnockout(false);
    if (res.ok) {
      show("success", "Auto-created any missing knockout slots (if ready).");
      router.refresh();
    } else {
      show("error", res.error);
    }
  };

  const createKnockoutShell = async () => {
    setCreatingKnockoutShell(true);
    const res = await createKnockoutShellFromStandingsAction({
      tournamentId: data.tournamentId,
      knockoutStartRound,
      includeThirdPlace,
    });
    setCreatingKnockoutShell(false);
    if (res.ok) {
      show("success", "Knockout shell created from standings.");
      router.refresh();
    } else {
      show("error", res.error);
    }
  };

  const removeMatch = async (matchId: string) => {
    const ok = confirm("Delete this match? This cannot be undone.");
    if (!ok) return;
    setDeletingMatchId(matchId);
    const res = await deleteMatchAction({
      tournamentId: data.tournamentId,
      matchId,
    });
    setDeletingMatchId(null);
    if (res.ok) {
      show("success", "Match deleted.");
      router.refresh();
    } else {
      show("error", res.error);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Match Center</h1>
          <p className="mt-1 text-sm text-slate-400">
            {data.tournamentName}
          </p>
          {data.championTeamName ? (
            <p className="mt-2 inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
              Champion: {data.championTeamName}
            </p>
          ) : null}
        </div>
      </header>

      {message && (
        <div
          className={
            message.type === "error"
              ? "rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200"
              : "rounded-lg border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200"
          }
        >
          {message.text}
        </div>
      )}

      <section className="rounded-xl border border-emerald-700/30 bg-emerald-500/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Next step</p>
        <h3 className="mt-2 text-lg font-semibold text-emerald-100">{nextStep.title}</h3>
        <p className="mt-1 text-sm text-emerald-200/85">{nextStep.description}</p>
        <button
          type="button"
          onClick={nextStep.onClick}
          disabled={nextStep.disabled}
          className="mt-3 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
        >
          {nextStep.cta}
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-xs text-slate-400">Matches total</p>
          <p className="mt-1 text-2xl font-bold text-slate-50">{data.matches.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-xs text-slate-400">Completed</p>
          <p className="mt-1 text-2xl font-bold text-slate-50">{completedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-xs text-slate-400">Remaining</p>
          <p className="mt-1 text-2xl font-bold text-slate-50">{remainingCount}</p>
        </div>
      </section>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        <div className="grid grid-cols-1 gap-2 border-b border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400 sm:grid-cols-10">
          <span className="sm:col-span-4">Match</span>
          <span className="sm:col-span-2">Time</span>
          <span className="sm:col-span-2">Score</span>
          <span className="sm:col-span-2 text-right">Action</span>
        </div>
        {sortedMatches.length === 0 ? (
          <div className="px-4 py-10 text-center text-slate-500">
            <p>No matches found.</p>
            {data.matches.length === 0 && (
              <p className="mt-1 text-xs text-slate-600">
                Generate fixtures to create matches.
              </p>
            )}
          </div>
        ) : (
          sortedMatches.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-1 items-center gap-2 border-b border-slate-800/80 px-4 py-3 last:border-b-0 sm:grid-cols-10"
            >
              <div className="sm:col-span-4 font-medium text-slate-100">
                {m.homeTeamName} <span className="text-slate-500">vs</span> {m.awayTeamName}
                <div className="mt-1 text-[11px] text-slate-500">{m.roundLabel ?? "Round"}</div>
              </div>
              <div className="sm:col-span-2 text-xs text-slate-400">
                {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : "Not scheduled"}
              </div>
              <div className="sm:col-span-2 text-sm text-slate-200">
                {isFinishedStatus(m.status) ? `${m.homeScore ?? 0}-${m.awayScore ?? 0}` : "-"}
              </div>
              <div className="sm:col-span-2 flex justify-end">
                {!m.scheduledAt ? (
                  <button
                    type="button"
                    onClick={() => openEditor(m)}
                    className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Set Time
                  </button>
                ) : isFinishedStatus(m.status) ? (
                  <Link
                    href={`/organizer/match/${m.id}`}
                    className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    View
                  </Link>
                ) : (
                  <Link
                    href={`/organizer/match/${m.id}`}
                    className="rounded-lg bg-emerald-500/20 px-2 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30"
                  >
                    Enter Result
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <details id="advanced-tools" className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-100">Advanced tools</summary>
        <p className="mt-2 text-xs text-slate-500">
          Manual/technical controls. Most organizers can skip this section.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            {generating ? "Creating..." : "Create Group Matches"}
          </button>
          <button
            type="button"
            onClick={autoCreateKnockout}
            disabled={generatingKnockout}
            className="rounded-lg border border-violet-700 bg-violet-950/40 px-4 py-2 text-sm font-medium text-violet-200 hover:bg-violet-900/40 disabled:opacity-50"
          >
            {generatingKnockout ? "Creating..." : "Create Next Round"}
          </button>
          <Link
            href={`/organizer/t/${data.tournamentId}/awards`}
            className="rounded-lg border border-amber-700/60 bg-amber-950/40 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-900/40"
          >
            View Awards
          </Link>
          <Link
            href={`/organizer/t/${data.tournamentId}`}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Back to Overview
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Teams ready for knockout</span>
            <select
              value={qualifiedCount}
              onChange={(e) => setQualifiedCount(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            >
              <option value="2">Top 2</option>
              <option value="4">Top 4</option>
              <option value="8">Top 8</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Knockout start</span>
            <select
              value={knockoutStartRound}
              onChange={(e) => setKnockoutStartRound(e.target.value as "QF" | "SF" | "F")}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            >
              <option value="QF">Quarterfinal</option>
              <option value="SF">Semifinal</option>
              <option value="F">Final</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Pairing mode</span>
            <select
              value={pairingMode}
              onChange={(e) => setPairingMode(e.target.value as "auto" | "manual" | "hybrid")}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            >
              <option value="auto">Auto</option>
              <option value="manual">Manual</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
            <span className="text-xs text-slate-300">Include third place</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-emerald-500"
              checked={includeThirdPlace}
              onChange={(e) => setIncludeThirdPlace(e.target.checked)}
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={createKnockoutShell}
            disabled={creatingKnockoutShell}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            {creatingKnockoutShell ? "Preparing..." : "Prepare Knockout Bracket"}
          </button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {data.qualifiedTeams.slice(0, Number(qualifiedCount)).map((t) => (
            <div key={t.teamId} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
              <span className="text-slate-500">#{t.rank}</span> {t.teamName}
            </div>
          ))}
          {data.qualifiedTeams.length === 0 ? (
            <p className="text-xs text-slate-500">No standings yet. Finish stage-1 matches first.</p>
          ) : null}
        </div>

        <div className="mt-3">
          <div className="mb-2 text-sm font-semibold text-slate-100">Add Match Manually</div>
          <ManualFixtureCreateCard tournamentId={data.tournamentId} teams={data.teams} />
        </div>

        <div className="mt-4 rounded-lg border border-red-900/60 bg-red-950/20 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-red-200">Delete wrong match</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {sortedMatches.slice(0, 8).map((m) => (
              <div key={`remove-${m.id}`} className="flex items-center justify-between rounded-md border border-red-900/40 bg-red-950/20 px-2 py-1.5">
                <span className="truncate text-xs text-red-100">
                  {m.homeTeamName} vs {m.awayTeamName}
                </span>
                <button
                  type="button"
                  onClick={() => removeMatch(m.id)}
                  disabled={deletingMatchId === m.id}
                  className="ml-2 rounded border border-red-800/70 px-2 py-0.5 text-[11px] text-red-200 hover:bg-red-900/30 disabled:opacity-50"
                >
                  {deletingMatchId === m.id ? "Removing..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </details>

      <MatchEditorDialog
        open={editorOpen}
        tournamentId={data.tournamentId}
        teams={data.teams}
        match={editing}
        onClose={() => setEditorOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

