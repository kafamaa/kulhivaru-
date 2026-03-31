export default function TournamentStandingsLoading() {
  return (
    <div className="space-y-6">
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="h-6 w-36 rounded bg-white/5" />
              <div className="mt-3 h-4 w-64 rounded bg-white/5" />
            </div>
            <div className="h-10 w-44 rounded bg-white/5" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="h-5 w-28 rounded bg-white/5" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-11 rounded bg-white/5" />
            <div className="h-11 rounded bg-white/5" />
            <div className="h-11 rounded bg-white/5" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="h-10 w-full rounded bg-white/5" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 w-full rounded-xl border border-white/10 bg-white/5" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

