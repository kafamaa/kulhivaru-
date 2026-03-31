import { FixturesMatchCardSkeleton } from "@/src/components/public/fixtures/fixtures-match-card-skeleton";

export default function FixturesLoading() {
  return (
    <div className="space-y-6">
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
          <div className="h-6 w-56 rounded bg-white/5" />
          <div className="mt-3 h-4 w-80 rounded bg-white/5" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="sticky top-[12.2rem] z-20 mt-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
            <div className="h-4 w-28 rounded bg-white/5" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-10 w-full rounded bg-white/5" />
              <div className="h-10 w-full rounded bg-white/5" />
              <div className="h-10 w-full rounded bg-white/5" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <FixturesMatchCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

