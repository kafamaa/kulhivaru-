import type { PublicPlayerPerformance } from "@/src/features/players/queries/get-public-player-performance";

import { StatCard } from "@/src/components/public/player-detail/stat-card";

export function PlayerStatsRow({
  performance,
}: {
  performance: PublicPlayerPerformance;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Matches Played" value={performance.matchesPlayed} icon={<span>🏟️</span>} />
        <StatCard label="Goals" value={performance.goals} icon={<span>⚽</span>} />
        <StatCard label="Assists" value={performance.assists} icon={<span>🅰</span>} />
        <StatCard
          label="Minutes Involved"
          value={performance.minutesInvolved}
          icon={<span>⏱️</span>}
        />
        <StatCard
          label="Yellow / Red"
          value={`${performance.yellowCards} / ${performance.redCards}`}
          icon={<span>🟨</span>}
        />
        <StatCard label="Appearances" value={performance.appearances} icon={<span>👤</span>} />
      </div>
    </section>
  );
}

