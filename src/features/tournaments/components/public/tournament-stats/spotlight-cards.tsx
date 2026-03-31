import Link from "next/link";

import type { TournamentStatsSpotlight } from "@/src/features/tournaments/queries/get-public-tournament-stats";

export function SpotlightCards({ spotlight }: { spotlight: TournamentStatsSpotlight }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.2)]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Spotlight</h3>
          <p className="mt-1 text-sm text-slate-400">
            Top performer highlights for this tournament scope.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] font-semibold text-slate-400">
            Top scorer
          </div>
          {spotlight.topScorer ? (
            <Link
              href={`/player/${spotlight.topScorer.playerId}`}
              className="mt-2 block min-w-0"
            >
              <div className="truncate text-sm font-semibold text-slate-50">
                {spotlight.topScorer.playerName}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {spotlight.topScorer.teamName}
              </div>
              <div className="mt-2 text-emerald-200 text-sm font-bold tabular-nums">
                {spotlight.topScorer.goals} goals
              </div>
            </Link>
          ) : (
            <div className="mt-2 text-xs text-slate-400">—</div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] font-semibold text-slate-400">
            Top assist
          </div>
          {spotlight.topAssist ? (
            <Link
              href={`/player/${spotlight.topAssist.playerId}`}
              className="mt-2 block min-w-0"
            >
              <div className="truncate text-sm font-semibold text-slate-50">
                {spotlight.topAssist.playerName}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {spotlight.topAssist.teamName}
              </div>
              <div className="mt-2 text-emerald-200 text-sm font-bold tabular-nums">
                {spotlight.topAssist.assists} assists
              </div>
            </Link>
          ) : (
            <div className="mt-2 text-xs text-slate-400">—</div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] font-semibold text-slate-400">
            Best team
          </div>
          {spotlight.bestTeam ? (
            <Link
              href={`/team/${spotlight.bestTeam.teamId}`}
              className="mt-2 block min-w-0"
            >
              <div className="truncate text-sm font-semibold text-slate-50">
                {spotlight.bestTeam.teamName}
              </div>
              <div className="mt-2 text-emerald-200 text-sm font-bold tabular-nums">
                {spotlight.bestTeam.points} pts
              </div>
            </Link>
          ) : (
            <div className="mt-2 text-xs text-slate-400">—</div>
          )}
        </div>
      </div>
    </div>
  );
}

