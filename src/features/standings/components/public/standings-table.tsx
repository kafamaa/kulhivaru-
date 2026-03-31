import Image from "next/image";
import Link from "next/link";

import type { PublicStandingsRow } from "@/src/features/standings/queries/get-public-tournament-standings";

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

function rowZone(rank: number) {
  // MVP: derived from rank only (no qualification rules persisted yet).
  if (rank <= 2) return "qualified";
  if (rank <= 4) return "playoff";
  return "eliminated";
}

function zoneClasses(zone: ReturnType<typeof rowZone>) {
  if (zone === "qualified") return "border-l-4 border-emerald-400/50 bg-emerald-400/5";
  if (zone === "playoff") return "border-l-4 border-amber-400/50 bg-amber-400/5";
  return "border-l-4 border-rose-400/40 bg-rose-400/5";
}

export function StandingsTable({ rows }: { rows: PublicStandingsRow[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.14)]">
      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Team</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300">P</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300">W</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300">D</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300">L</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300">GF</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300">GA</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300">GD</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((r) => {
                const zone = rowZone(r.rank);
                return (
                  <tr
                    key={r.teamId}
                    className={`group ${zoneClasses(zone)} border-l-white/10`}
                  >
                    <td className="px-4 py-3">
                      <RankBadge rank={r.rank} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/team/${r.teamId}`}
                        className="flex items-center gap-3 min-w-0 hover:text-emerald-200"
                      >
                        <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                          {r.logoUrl ? (
                            <Image
                              src={r.logoUrl}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-300">
                              {r.teamName.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="truncate text-sm font-semibold text-slate-50">
                          {r.teamName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-200 tabular-nums">
                      {r.played}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-emerald-200 tabular-nums">
                      {r.wins}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-200 tabular-nums">
                      {r.draws}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-rose-200 tabular-nums">
                      {r.losses}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-50 tabular-nums">
                      {r.goalsFor}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-50 tabular-nums">
                      {r.goalsAgainst}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-50 tabular-nums">
                      {r.goalDifference >= 0 ? `+${r.goalDifference}` : r.goalDifference}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-extrabold text-emerald-200 tabular-nums">
                      {r.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {rows.map((r) => {
          const zone = rowZone(r.rank);
          return (
            <div key={r.teamId} className={`rounded-2xl border ${zoneClasses(zone)} border-white/10 p-4`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <RankBadge rank={r.rank} />
                  <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    {r.logoUrl ? (
                      <Image src={r.logoUrl} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-300">
                        {r.teamName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <Link href={`/team/${r.teamId}`} className="truncate text-sm font-semibold text-slate-50">
                    {r.teamName}
                  </Link>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-200 tabular-nums">{r.points}</div>
                  <div className="text-[11px] font-semibold text-slate-400">Pts</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold">
                <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 text-center">
                  P: {r.played}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-emerald-200 text-center">
                  W: {r.wins}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 text-center">
                  D: {r.draws}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-rose-200 text-center">
                  L: {r.losses}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-50 text-center">
                  GF: {r.goalsFor}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-50 text-center">
                  GA: {r.goalsAgainst}
                </div>
              </div>
              <div className="mt-3 text-xs font-semibold text-slate-300">
                GD:{" "}
                <span className="text-slate-50 tabular-nums">
                  {r.goalDifference >= 0 ? `+${r.goalDifference}` : r.goalDifference}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

