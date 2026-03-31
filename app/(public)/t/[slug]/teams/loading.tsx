import { TournamentTeamCardSkeleton } from "@/src/features/teams/components/public/tournament-team-card-skeleton";

export default function TournamentTeamsLoading() {
  return (
    <div className="space-y-6">
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
          <div className="h-6 w-56 animate-pulse rounded bg-white/5" />
          <div className="mt-3 h-4 w-96 animate-pulse rounded bg-white/5" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.18)]">
          <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-white/5" />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <TournamentTeamCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

