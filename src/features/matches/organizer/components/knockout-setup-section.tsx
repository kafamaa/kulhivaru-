"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createKnockoutShellFromStandingsAction,
  generateNextKnockoutRoundAction,
} from "@/src/features/matches/organizer/actions/match-actions";
import type { KnockoutSetupData } from "@/src/features/matches/organizer/queries/get-knockout-setup-data";
import { useRouter } from "next/navigation";

export function KnockoutSetupSection({ data }: { data: KnockoutSetupData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [qualifiedCount, setQualifiedCount] = useState("4");
  const [startRound, setStartRound] = useState<"QF" | "SF" | "F">("SF");
  const [pairingMode, setPairingMode] = useState<"auto" | "manual" | "hybrid">("hybrid");
  const [includeThirdPlace, setIncludeThirdPlace] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const slots = ["QF1", "QF2", "QF3", "QF4", "SF1", "SF2", "F1", "TP1"] as const;

  const runAutoGenerate = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await generateNextKnockoutRoundAction({
        tournamentId: data.tournamentId,
        includeThirdPlace,
      });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setMessage("Knockout auto-generation completed.");
      router.refresh();
    });
  };

  const createShell = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await createKnockoutShellFromStandingsAction({
        tournamentId: data.tournamentId,
        knockoutStartRound: startRound,
        includeThirdPlace,
      });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setMessage("Knockout shell created from standings sources.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Knockout Setup</h1>
          <p className="mt-1 text-sm text-slate-400">
            Qualify teams from standings and generate QF/SF/Final.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/organizer/t/${data.tournamentId}/matches`} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
            Back to matches
          </Link>
          <Link href={`/organizer/t/${data.tournamentId}/knockout`} className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/30">
            Open knockout board
          </Link>
        </div>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Qualification + generation</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Qualified teams</span>
            <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" value={qualifiedCount} onChange={(e) => setQualifiedCount(e.target.value)}>
              <option value="2">Top 2</option>
              <option value="4">Top 4</option>
              <option value="8">Top 8</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Knockout starts from</span>
            <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" value={startRound} onChange={(e) => setStartRound(e.target.value as "QF" | "SF" | "F")}>
              <option value="QF">Quarterfinal</option>
              <option value="SF">Semifinal</option>
              <option value="F">Final</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-400">Pairing mode</span>
            <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" value={pairingMode} onChange={(e) => setPairingMode(e.target.value as "auto" | "manual" | "hybrid")}>
              <option value="auto">Auto</option>
              <option value="manual">Manual</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
            <span className="text-xs text-slate-300">Include 3rd Place</span>
            <input type="checkbox" className="h-4 w-4 accent-emerald-500" checked={includeThirdPlace} onChange={(e) => setIncludeThirdPlace(e.target.checked)} />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={runAutoGenerate} className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-50">
            {pending ? "Working…" : "Generate Automatically"}
          </button>
          <button type="button" disabled={pending} onClick={createShell} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 disabled:opacity-50">
            {pending ? "Working…" : "Create Knockout Shell"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Selected setup: top {qualifiedCount}, start {startRound}, mode {pairingMode}.
        </p>
        {message ? <p className="mt-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">{message}</p> : null}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Qualified teams preview</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {data.qualifiedTeams.slice(0, 8).map((t) => (
            <div key={t.teamId} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
              <span className="text-slate-500">#{t.rank}</span> {t.teamName}
            </div>
          ))}
          {data.qualifiedTeams.length === 0 ? (
            <p className="text-xs text-slate-500">No standings yet. Complete stage-1 matches first.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Knockout slots status</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((slot) => {
            const m = data.slots.find((x) => x.slotCode === slot);
            const status = !m ? "not created" : m.homeTeamName === "TBD" || m.awayTeamName === "TBD" ? "pending sources" : m.status;
            return (
              <div key={slot} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
                <div className="text-xs font-semibold text-slate-200">{slot}</div>
                <div className="mt-1 text-[11px] text-slate-400">{m ? `${m.homeTeamName} vs ${m.awayTeamName}` : "Not created"}</div>
                <div className="mt-1 text-[11px] text-slate-500">{status}{m ? ` (${m.sourceType})` : ""}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
