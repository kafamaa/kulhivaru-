import Link from "next/link";

import type { PublicPlayerProfile } from "@/src/features/players/queries/get-public-player-profile";
import type { PublicPlayerPerformance } from "@/src/features/players/queries/get-public-player-performance";
import type { PublicPlayerRankings } from "@/src/features/players/queries/get-public-player-rankings";
import type { PublicPlayerRecentMatch } from "@/src/features/players/queries/get-public-player-recent-matches";

function SummaryLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-50 tabular-nums">{value}</span>
    </div>
  );
}

function RecentMatchesPreview({
  matches,
}: {
  matches: PublicPlayerRecentMatch[];
}) {
  return (
    <div className="space-y-3">
      {matches.slice(0, 5).map((m) => (
        <Link
          key={m.matchId}
          href={`/match/${m.matchId}`}
          className="block rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-colors hover:border-emerald-400/25"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-50">
                vs {m.opponentTeamName}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {m.tournamentName}
                {m.roundLabel ? ` · ${m.roundLabel}` : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-50 tabular-nums">
                {m.scoreText ?? "—"}
              </div>
              <div className="mt-1 text-[11px] font-semibold text-slate-400">
                {m.status}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function PlayerOverviewPanel({
  profile,
  performance,
  recentMatches,
  rankings,
}: {
  profile: PublicPlayerProfile;
  performance: PublicPlayerPerformance;
  recentMatches: PublicPlayerRecentMatch[];
  rankings: PublicPlayerRankings;
}) {
  const topTournament = profile.tournaments[0] ?? null;
  const team = profile.team;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-slate-50">Performance Summary</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <SummaryLine label="Goals" value={performance.goals} />
              <SummaryLine label="Assists" value={performance.assists} />
              <SummaryLine label="Matches" value={performance.matchesPlayed} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-50">Recent Matches</h2>
              {recentMatches.length > 0 ? (
                <Link
                  href="#player-matches"
                  className="text-sm font-semibold text-emerald-200 hover:text-emerald-300"
                >
                  View all →
                </Link>
              ) : null}
            </div>
            {recentMatches.length === 0 ? (
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
                No matches played yet
              </div>
            ) : (
              <div className="mt-4">
                <RecentMatchesPreview matches={recentMatches} />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-slate-50">Ranking</h2>
            {rankings.topScorersRank != null ? (
              <div className="mt-3 rounded-3xl border border-emerald-400/25 bg-emerald-400/10 p-4">
                <div className="text-xs font-semibold text-emerald-200">
                  Top scorer position
                </div>
                <div className="mt-1 text-3xl font-bold text-slate-50 tabular-nums">
                  #{rankings.topScorersRank}
                </div>
                <div className="mt-1 text-sm text-slate-200">
                  {rankings.topScorersGoals} goals
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                Ranking not available yet.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-slate-50">Team Context</h2>
            {team?.teamId ? (
              <div className="mt-3">
                <Link
                  href={`/team/${team.teamId}`}
                  className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:text-emerald-200"
                >
                  {team.teamName} →
                </Link>
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-400">Team TBD</div>
            )}

            {topTournament?.tournamentSlug ? (
              <div className="mt-3 text-sm text-slate-400">
                {topTournament.tournamentName}
                {topTournament.categoryDivision
                  ? ` · ${topTournament.categoryDivision}`
                  : ""}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div id="player-matches" />
    </div>
  );
}

