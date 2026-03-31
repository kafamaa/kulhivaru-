import Image from "next/image";
import Link from "next/link";
import { TournamentGroupSelector } from "./tournament-group-selector";

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

interface GroupOption {
  groupId: string | null;
  label: string;
  teamsCount: number;
}

interface StandingRow {
  rank: number;
  teamId: string;
  teamName: string;
  played: number;
  points: number;
  logoUrl: string | null;
}

export function TournamentStandingsPreviewSection({
  slug,
  groupLabel,
  groups,
  selectedGroupId,
  standingsPreview,
}: {
  slug: string;
  groupLabel: string;
  groups: GroupOption[];
  selectedGroupId: string | null;
  standingsPreview: StandingRow[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Standings</h2>
          <p className="mt-1 text-sm text-slate-400">
            Top teams right now (filter by category).
          </p>
        </div>
        <div className="w-full max-w-[320px]">
          <TournamentGroupSelector groups={groups} selectedGroupId={selectedGroupId} />
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-200">
            Showing: {groupLabel}
          </div>
          <Link
            href={`/t/${slug}/standings`}
            className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
          >
            View Full →
          </Link>
        </div>

        {standingsPreview.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
            Standings aren’t available for this category yet.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1fr_2fr_1fr_1fr] bg-white/5 px-4 py-3 text-xs font-semibold text-slate-300">
              <div>Rank</div>
              <div>Team</div>
              <div className="text-center">Played</div>
              <div className="text-right">Points</div>
            </div>
            <div className="divide-y divide-white/10">
              {standingsPreview.map((r) => (
                <div
                  key={r.teamId}
                  className="grid grid-cols-[1fr_2fr_1fr_1fr] items-center px-4 py-3"
                >
                  <div>
                    <RankBadge rank={r.rank} />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/team/${r.teamId}`} className="flex items-center gap-3">
                      <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                        {r.logoUrl ? (
                          <Image src={r.logoUrl} alt="" fill className="object-cover" />
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
                  </div>
                  <div className="text-center text-sm font-semibold text-slate-200 tabular-nums">
                    {r.played}
                  </div>
                  <div className="text-right text-sm font-bold text-emerald-200 tabular-nums">
                    {r.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
