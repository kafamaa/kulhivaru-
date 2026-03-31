import { TournamentMediaCardSkeleton } from "@/src/features/tournaments/components/public/tournament-media/media-card-skeleton";

export default function TournamentMediaLoading() {
  return (
    <div className="space-y-6">
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="h-6 w-64 animate-pulse rounded bg-white/5" />
              <div className="mt-2 h-4 w-96 animate-pulse rounded bg-white/5" />
            </div>
            <div className="h-10 w-40 animate-pulse rounded-full bg-white/5" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-36 animate-pulse rounded-full bg-white/5" />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="sticky top-[12.2rem] z-20 mt-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
            <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:w-[720px] lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <TournamentMediaCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

