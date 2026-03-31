import type { PlatformStats } from "@/src/features/stats/queries/get-platform-stats";
import Link from "next/link";

export function StatsOverviewStrip({
  platform,
  topScorer,
  topTeam,
}: {
  platform: PlatformStats | null;
  topScorer: { id: string; name: string; goals: number; teamName: string } | null;
  topTeam: { teamId: string; teamName: string; points: number } | null;
}) {
  const tournamentsHosted = platform?.tournamentsHosted ?? 0;
  const matchesPlayed = platform?.matchesPlayed ?? 0;
  const teamsRegistered = platform?.teamsRegistered ?? 0;

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Top scorer
              </p>
              {topScorer ? (
                <div className="mt-2">
                  <Link
                    href={`/player/${topScorer.id}`}
                    className="text-sm font-semibold text-slate-50 hover:text-emerald-300"
                  >
                    {topScorer.name}
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">
                    {topScorer.teamName} · {topScorer.goals} goals
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No scorer data</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Best team
              </p>
              {topTeam ? (
                <div className="mt-2">
                  <Link
                    href={`/team/${topTeam.teamId}`}
                    className="text-sm font-semibold text-slate-50 hover:text-emerald-300"
                  >
                    {topTeam.teamName}
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">
                    {topTeam.points} pts
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No standings data</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Platform scale
              </p>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Tournaments</span>
                  <span className="font-semibold text-emerald-200 tabular-nums">
                    {tournamentsHosted}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Matches</span>
                  <span className="font-semibold text-emerald-200 tabular-nums">
                    {matchesPlayed}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Teams</span>
                  <span className="font-semibold text-emerald-200 tabular-nums">
                    {teamsRegistered}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

