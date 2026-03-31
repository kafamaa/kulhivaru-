export default function TournamentStatsLoading() {
  return (
    <div className="space-y-6">
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="h-6 w-56 rounded bg-white/5" />
              <div className="mt-2 h-4 w-72 rounded bg-white/5" />
            </div>
            <div className="h-10 w-36 rounded bg-white/5" />
          </div>
        </div>
      </section>

      <div className="px-4">
        <div className="mx-auto max-w-7xl">
          <div className="h-16 rounded-3xl border border-white/10 bg-white/5 p-4" />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.18)]">
          <div className="h-6 w-64 rounded bg-white/5" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="h-20 rounded-2xl border border-white/10 bg-white/5" />
            <div className="h-20 rounded-2xl border border-white/10 bg-white/5" />
            <div className="h-20 rounded-2xl border border-white/10 bg-white/5" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="h-12 w-full rounded-3xl border border-white/10 bg-white/5" />
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 rounded-3xl border border-white/10 bg-white/5" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-10 w-full rounded-3xl border border-white/10 bg-white/5" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 rounded-3xl border border-white/10 bg-white/5" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

