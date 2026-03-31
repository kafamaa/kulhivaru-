import Link from "next/link";
import type { TopAssistPreview } from "@/src/features/stats/queries/get-top-assists-preview";
import type { TopScorerByTournamentPreview } from "@/src/features/stats/queries/get-top-scorers-by-tournament-preview";

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

export function TournamentTopPerformersSection({
  slug,
  topScorers,
  topAssists,
}: {
  slug: string;
  topScorers: TopScorerByTournamentPreview[];
  topAssists: TopAssistPreview[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Top Performers</h2>
          <p className="mt-1 text-sm text-slate-400">
            Quick snapshots of player form inside this tournament.
          </p>
        </div>
        <Link
          href={`/t/${slug}/stats`}
          className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
        >
          View Full →
        </Link>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="text-sm font-semibold text-slate-200">Top Scorers</div>
          {topScorers.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
              No top scorer data yet.
            </div>
          ) : (
            <div className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10">
              {topScorers.map((p, idx) => (
                <div key={p.playerId} className="flex items-center justify-between px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <RankBadge rank={idx + 1} />
                    <div className="min-w-0">
                      <Link
                        href={`/player/${p.playerId}`}
                        className="block truncate text-sm font-semibold text-slate-50 hover:text-emerald-300"
                      >
                        {p.playerName}
                      </Link>
                      <p className="mt-1 truncate text-xs text-slate-400">{p.teamName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-200 tabular-nums">
                      {p.goals}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-400">goals</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="text-sm font-semibold text-slate-200">Assists</div>
          {topAssists.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
              No assist data yet.
            </div>
          ) : (
            <div className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10">
              {topAssists.map((p, idx) => (
                <div key={p.playerId} className="flex items-center justify-between px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <RankBadge rank={idx + 1} />
                    <div className="min-w-0">
                      <Link
                        href={`/player/${p.playerId}`}
                        className="block truncate text-sm font-semibold text-slate-50 hover:text-emerald-300"
                      >
                        {p.playerName}
                      </Link>
                      <p className="mt-1 truncate text-xs text-slate-400">{p.teamName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-200 tabular-nums">
                      {p.assists}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-400">assists</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
