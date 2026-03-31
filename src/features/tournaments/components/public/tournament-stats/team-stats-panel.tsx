import Image from "next/image";
import Link from "next/link";

import type { TeamLeaderboardRow } from "@/src/features/tournaments/queries/get-public-tournament-stats";

function RankBadge({ rank }: { rank: number }) {
  const isTop3 = rank === 1 || rank === 2 || rank === 3;
  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-xl border px-2 text-xs font-bold tabular-nums ${
        isTop3
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/5 text-slate-300"
      }`}
    >
      {rank}
    </span>
  );
}

export function TeamStatsPanel({
  title,
  rows,
  valueLabel,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  rows: TeamLeaderboardRow[];
  valueLabel: (row: TeamLeaderboardRow) => { value: number; label: string; valueClassName?: string };
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.14)]">
      <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">
        Team comparison for the selected scope.
      </p>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="text-sm font-semibold text-slate-50">{emptyTitle}</div>
          <div className="mt-2 text-sm text-slate-400">{emptyDescription}</div>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
          {rows.map((r, idx) => {
            const { value, label, valueClassName } = valueLabel(r);
            return (
              <div
                key={r.teamId}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <RankBadge rank={idx + 1} />
                  <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    {r.teamLogoUrl ? (
                      <Image src={r.teamLogoUrl} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-300">
                        {r.teamName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/team/${r.teamId}`}
                      className="block truncate text-sm font-semibold text-slate-50 hover:text-emerald-200"
                    >
                      {r.teamName}
                    </Link>
                    <div className="mt-1 text-xs text-slate-400">
                      Pts {r.points} · GD{" "}
                      {r.goalDifference >= 0 ? `+${r.goalDifference}` : r.goalDifference}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={valueClassName ?? "text-sm font-bold text-emerald-200 tabular-nums"}>
                    {value}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400">{label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

