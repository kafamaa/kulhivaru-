import Image from "next/image";
import Link from "next/link";

import type { TournamentTeamDirectoryRow } from "@/src/features/teams/queries/get-public-tournament-teams-directory";

function StatusPill({ row }: { row: TournamentTeamDirectoryRow }) {
  const zone = row.derivedStatus;
  const cls =
    zone === "leading"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : zone === "qualified"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
        : zone === "eliminated"
          ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
          : zone === "active"
            ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
            : "border-white/10 bg-white/5 text-slate-300";

  const label =
    zone === "leading"
      ? "Leading"
      : zone === "qualified"
        ? "Qualified"
        : zone === "eliminated"
          ? "Eliminated"
          : zone === "active"
            ? "Active"
            : "Unranked";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">
      <span className="text-slate-300">{label}:</span>&nbsp;
      <span className="text-slate-50 tabular-nums">{value}</span>
    </span>
  );
}

export function TournamentTeamCard({ row }: { row: TournamentTeamDirectoryRow }) {
  return (
    <article className="group relative rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.12)] transition-colors hover:border-emerald-400/30">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {row.teamLogoUrl ? (
                <Image
                  src={row.teamLogoUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-300">
                  {row.teamName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-slate-50">
                  {row.teamName}
                </h3>
                {row.isPlayingNow ? (
                  <span className="inline-flex items-center rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-100">
                    LIVE
                  </span>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {row.rank != null ? (
                  <>
                    Rank <span className="font-semibold text-slate-200 tabular-nums">#{row.rank}</span>
                  </>
                ) : (
                  "Rank TBD"
                )}
              </div>
            </div>
          </div>

          <StatusPill row={row} />
        </div>

        <div className="flex flex-wrap gap-2">
          <StatChip label="Played" value={row.played} />
          <StatChip label="Pts" value={row.points} />
          {row.goalDifference !== 0 ? (
            <StatChip
              label="GD"
              value={row.goalDifference >= 0 ? `+${row.goalDifference}` : row.goalDifference}
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            W-L: <span className="text-slate-200 font-semibold tabular-nums">{row.wins}</span>-{" "}
            <span className="text-slate-200 font-semibold tabular-nums">{row.losses}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/team/${row.teamId}`}
              className="inline-flex items-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
            >
              View Team →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

