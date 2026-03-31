import Link from "next/link";

import type { PublicPlayerPerformance } from "@/src/features/players/queries/get-public-player-performance";
import type { PublicPlayerProfile } from "@/src/features/players/queries/get-public-player-profile";

import { StatCard } from "@/src/components/public/player-detail/stat-card";

function safeDiv(n: number, d: number) {
  if (d <= 0) return 0;
  return n / d;
}

function StatRow({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-50 tabular-nums">
        {value.toFixed(2)}
        {unit ? ` ${unit}` : ""}
      </span>
    </div>
  );
}

export function PlayerStatsPanel({
  profile,
  performance,
}: {
  profile: PublicPlayerProfile;
  performance: PublicPlayerPerformance;
}) {
  const matches = Math.max(0, performance.matchesPlayed);
  const goalsPerMatch = safeDiv(performance.goals, matches);
  const assistsPerMatch = safeDiv(performance.assists, matches);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      <div className="space-y-4">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-semibold text-slate-50">Stats</h2>
          <p className="mt-1 text-sm text-slate-400">
            MVP: derived from logged match events. Advanced metrics (shots/passes) will come later.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Goals" value={performance.goals} icon={<span>⚽</span>} />
            <StatCard label="Assists" value={performance.assists} icon={<span>🅰</span>} />
            <StatCard label="Yellow Cards" value={performance.yellowCards} icon={<span>🟨</span>} />
            <StatCard label="Red Cards" value={performance.redCards} icon={<span>🟥</span>} />
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-slate-200">Per-match averages</h3>
            <div className="mt-3 grid gap-2">
              <StatRow label="Goals / match" value={goalsPerMatch} />
              <StatRow label="Assists / match" value={assistsPerMatch} />
              <StatRow
                label="Minutes involved / match"
                value={safeDiv(performance.minutesInvolved, matches)}
              />
            </div>
          </div>
        </section>

        {profile.team?.teamId ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.08)]">
            <h2 className="text-lg font-semibold text-slate-50">Team</h2>
            <div className="mt-3">
              <Link
                href={`/team/${profile.team.teamId}`}
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400/25 hover:text-emerald-200"
              >
                {profile.team.teamName} →
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

