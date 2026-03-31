export default async function AdminAnalyticsPage() {
  const { getAdminAnalyticsSnapshot } = await import(
    "@/src/features/admin/queries/get-admin-analytics"
  );
  const snapshot = await getAdminAnalyticsSnapshot();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-zinc-400">
          High-level metrics for platform health and growth (server-side counts).
        </p>
      </header>

      {!snapshot.ok ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {snapshot.error}
        </div>
      ) : (
        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {(
            [
              ["Active tournaments", snapshot.data.activeTournaments],
              ["Matches recorded", snapshot.data.matches],
              ["Registered players", snapshot.data.players],
              ["Organizations", snapshot.data.organizations],
              ["Tournaments (total)", snapshot.data.tournaments],
              ["Standings rows", snapshot.data.standingsRows],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-black/25 p-4 shadow-lg shadow-black/10"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-white">{value}</p>
            </div>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-400">
        <p className="font-medium text-zinc-200">Roadmap</p>
        <p className="mt-2">
          Time-series charts (signups, matches per week, retention) can be added when
          you wire analytics storage or an external provider. This page stays fast and
          dependency-free using direct counts via the service role.
        </p>
      </section>
    </div>
  );
}
