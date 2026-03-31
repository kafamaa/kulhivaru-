import { SkeletonLoader } from "@/src/components/public/shared/skeleton-loader";

export default function PlayerDetailLoading() {
  return (
    <div className="space-y-6">
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_25px_110px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
              <div className="min-w-0 space-y-3">
                <div className="h-6 w-56 animate-pulse rounded bg-white/5" />
                <div className="h-4 w-72 animate-pulse rounded bg-white/5" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-9 w-28 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-40 animate-pulse rounded-full border border-white/10 bg-white/5"
                  />
                ))}
              </div>
              <div className="h-10 w-56 animate-pulse rounded-2xl border border-emerald-400/20 bg-emerald-400/10" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.08)]"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
              <div className="mt-3 h-8 w-20 animate-pulse rounded bg-white/5" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.14)]">
          <div className="h-6 w-44 animate-pulse rounded bg-white/5" />
          <div className="mt-3">
            <SkeletonLoader lines={8} />
          </div>
        </div>
      </section>
    </div>
  );
}

