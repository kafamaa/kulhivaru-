"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { recomputeStandingsCacheAction } from "@/src/features/standings/organizer/actions/standings-actions";
import type { OrganizerTournamentStandingsAdminData } from "@/src/features/standings/organizer/queries/get-tournament-standings-admin";

export function StandingsAdminSection({
  data,
}: {
  data: OrganizerTournamentStandingsAdminData;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<
    { kind: "success" | "error"; text: string } | undefined
  >(undefined);

  const lastUpdatedLabel = useMemo(() => {
    if (!data.lastUpdatedAt) return "Never";
    try {
      return new Date(data.lastUpdatedAt).toLocaleString();
    } catch {
      return data.lastUpdatedAt;
    }
  }, [data.lastUpdatedAt]);

  function onRecompute() {
    setMessage(undefined);
    startTransition(async () => {
      const res = await recomputeStandingsCacheAction({
        tournamentId: data.tournamentId,
      });
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error });
        return;
      }
      setMessage({
        kind: "success",
        text: `Recomputed standings (${res.rowsUpserted} rows).`,
      });
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-slate-50">
            Standings admin
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            MVP standings are computed from finished matches (status: ft /
            completed).
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Last cache update:{" "}
            <span className="font-medium text-slate-300">
              {lastUpdatedLabel}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/organizer/t/${data.tournamentId}/matches`}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Matches
          </Link>
          <button
            type="button"
            onClick={onRecompute}
            disabled={pending}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {pending ? "Recomputing…" : "Recompute cache"}
          </button>
        </div>
      </header>

      {message && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            message.kind === "success"
              ? "border-emerald-800 bg-emerald-950/20 text-emerald-200"
              : "border-red-800 bg-red-950/20 text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Standings cache
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Sorted by rank. Group/phase support will appear here later.
          </p>
        </div>

        {data.rows.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">
            No cached rows yet. Finish at least one match, then recompute.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th className="w-14">#</th>
                  <th>Team</th>
                  <th className="w-24">P</th>
                  <th className="w-24">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {data.rows.map((r) => (
                  <tr key={r.teamId} className="[&>td]:px-4 [&>td]:py-3">
                    <td className="text-slate-400 tabular-nums">{r.rank}</td>
                    <td className="font-medium text-slate-100">{r.teamName}</td>
                    <td className="tabular-nums">{r.played}</td>
                    <td className="tabular-nums font-semibold">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
          <p className="font-semibold text-slate-100">What gets computed</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
            <li>Played + points (3 win / 1 draw / 0 loss)</li>
            <li>Rank by points (then played, then team id)</li>
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
          <p className="font-semibold text-slate-100">What’s next</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
            <li>Goal difference + goals for/against</li>
            <li>Group/phase standings and tiebreak rules</li>
            <li>Auto-recompute on result entry</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

