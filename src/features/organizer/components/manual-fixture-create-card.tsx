"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createManualFixtureAction } from "@/src/features/matches/organizer/actions/match-actions";

export function ManualFixtureCreateCard({
  tournamentId,
  teams,
}: {
  tournamentId: string;
  teams: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [roundLabel, setRoundLabel] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [message, setMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const disabled = pending || teams.length < 2;

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await createManualFixtureAction({
        tournamentId,
        homeTeamId,
        awayTeamId,
        roundLabel: roundLabel.trim() || null,
        scheduledAt: scheduledAt || null,
      });
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error });
        return;
      }
      setMessage({ kind: "success", text: "Manual fixture created." });
      setHomeTeamId("");
      setAwayTeamId("");
      setRoundLabel("");
      setScheduledAt("");
      router.refresh();
    });
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <h2 className="text-sm font-semibold text-slate-100">Manual fixture create</h2>
      <p className="mt-1 text-xs text-slate-500">
        Create one fixture manually from approved teams.
      </p>
      {message ? (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
            message.kind === "success"
              ? "border-emerald-800 bg-emerald-950/20 text-emerald-200"
              : "border-red-800 bg-red-950/20 text-red-200"
          }`}
        >
          {message.text}
        </p>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-slate-400">Home team</span>
          <select
            value={homeTeamId}
            onChange={(e) => setHomeTeamId(e.target.value)}
            className={inputClass}
            disabled={disabled}
          >
            <option value="">Select home team</option>
            {teams.map((t) => (
              <option key={`h-${t.id}`} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-400">Away team</span>
          <select
            value={awayTeamId}
            onChange={(e) => setAwayTeamId(e.target.value)}
            className={inputClass}
            disabled={disabled}
          >
            <option value="">Select away team</option>
            {teams.map((t) => (
              <option key={`a-${t.id}`} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-400">Round label</span>
          <input
            value={roundLabel}
            onChange={(e) => setRoundLabel(e.target.value)}
            className={inputClass}
            placeholder="Round 1"
            disabled={disabled}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-400">Kickoff (optional)</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={inputClass}
            disabled={disabled}
          />
        </label>
      </div>
      <div className="mt-4">
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !homeTeamId || !awayTeamId}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create manual fixture"}
        </button>
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100";
