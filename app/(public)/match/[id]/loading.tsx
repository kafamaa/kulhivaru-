export default function MatchDetailLoading() {
  return (
    <div className="space-y-6">
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_25px_100px_rgba(0,0,0,0.35)]">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              <div className="min-w-0">
                <div className="h-5 w-40 animate-pulse rounded bg-white/5" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-white/5" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="h-8 w-28 animate-pulse rounded-full border border-white/10 bg-white/5" />
              <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4">
                <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
                <div className="mt-3 h-10 w-44 animate-pulse rounded bg-white/5" />
                <div className="mt-2 h-3 w-64 animate-pulse rounded bg-white/5" />
              </div>
              <div className="h-3 w-72 animate-pulse rounded bg-white/5" />
            </div>
            <div className="flex items-center gap-3 min-w-0 justify-end">
              <div className="min-w-0 text-right">
                <div className="h-5 w-40 animate-pulse rounded bg-white/5 mx-auto" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-white/5 mx-auto" />
              </div>
              <div className="h-12 w-12 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.14)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <div className="h-8 w-40 animate-pulse rounded-full border border-white/10 bg-white/5" />
              <div className="h-8 w-32 animate-pulse rounded-full border border-white/10 bg-white/5" />
            </div>
            <div className="h-4 w-44 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.14)]">
          <div className="h-6 w-44 animate-pulse rounded bg-white/5" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-white/5" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="h-4 w-60 animate-pulse rounded bg-white/5" />
                <div className="mt-2 h-3 w-72 animate-pulse rounded bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.14)]">
          <div className="h-6 w-52 animate-pulse rounded bg-white/5" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-white/5" />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-44 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

