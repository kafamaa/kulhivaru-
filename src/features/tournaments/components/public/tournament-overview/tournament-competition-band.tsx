import Image from "next/image";
import Link from "next/link";
import { TournamentGroupSelector } from "./tournament-group-selector";
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

function PlayerMiniAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-[10px] font-bold text-slate-200">
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill className="object-cover" />
      ) : (
        initials
      )}
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

export function TournamentCompetitionBand({
  slug,
  groupLabel,
  groups,
  selectedGroupId,
  standingsPreview,
  topScorers,
  topAssists,
}: {
  slug: string;
  groupLabel: string;
  groups: GroupOption[];
  selectedGroupId: string | null;
  standingsPreview: StandingRow[];
  topScorers: TopScorerByTournamentPreview[];
  topAssists: TopAssistPreview[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-50">Standings & Leaders</h2>
        <p className="mt-1 text-sm text-slate-400">
          Current rankings plus top performers in this tournament.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-slate-200">Showing: {groupLabel}</div>
            <div className="flex w-full max-w-[380px] items-center gap-3">
              <div className="flex-1">
                <TournamentGroupSelector groups={groups} selectedGroupId={selectedGroupId} />
              </div>
              <Link
                href={`/t/${slug}/standings`}
                className="shrink-0 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
              >
                Full →
              </Link>
            </div>
          </div>

          {standingsPreview.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
              Standings are not available for this category yet.
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
                    <Link href={`/team/${r.teamId}`} className="flex min-w-0 items-center gap-3">
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

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Top Performers</h3>
            <Link
              href={`/t/${slug}/stats`}
              className="text-xs font-semibold text-emerald-300 hover:text-emerald-200"
            >
              Full stats →
            </Link>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Scorers
            </div>
            {topScorers.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No scorer data yet.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {topScorers.slice(0, 4).map((p, idx) => (
                  <div key={p.playerId} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-sm text-slate-200">
                      <span className="font-semibold text-slate-100">{idx + 1}.</span>
                      <PlayerMiniAvatar name={p.playerName} imageUrl={p.playerImageUrl} />
                      <div className="min-w-0">
                        <Link
                          href={`/player/${p.playerId}`}
                          className="block truncate text-sm font-medium hover:text-emerald-300"
                        >
                          {p.playerName}
                        </Link>
                        <div className="truncate text-[11px] text-slate-500">{p.teamName}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-200 tabular-nums">
                      {p.goals}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Assists
            </div>
            {topAssists.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No assist data yet.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {topAssists.slice(0, 4).map((p, idx) => (
                  <div key={p.playerId} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-sm text-slate-200">
                      <span className="font-semibold text-slate-100">{idx + 1}.</span>
                      <PlayerMiniAvatar name={p.playerName} imageUrl={p.playerImageUrl} />
                      <div className="min-w-0">
                        <Link
                          href={`/player/${p.playerId}`}
                          className="block truncate text-sm font-medium hover:text-emerald-300"
                        >
                          {p.playerName}
                        </Link>
                        <div className="truncate text-[11px] text-slate-500">{p.teamName}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-200 tabular-nums">
                      {p.assists}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
