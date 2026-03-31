import type { PlatformStats } from "@/src/features/stats/queries/get-platform-stats";

interface TrustStatsSectionProps {
  stats: PlatformStats | null;
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-md">
      <div className="text-3xl font-bold text-emerald-300">{value}</div>
      <div className="mt-1 text-sm text-slate-300">{label}</div>
    </div>
  );
}

export function TrustStatsSection({ stats }: TrustStatsSectionProps) {
  if (!stats) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-50">
          Trusted by organizers and teams
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Platform scale across tournaments and match days.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="Tournaments hosted"
          value={stats.tournamentsHosted}
        />
        <StatTile label="Teams registered" value={stats.teamsRegistered} />
        <StatTile label="Matches played" value={stats.matchesPlayed} />
      </div>
    </section>
  );
}

