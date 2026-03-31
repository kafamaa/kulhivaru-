export function TournamentTeamCardSkeleton() {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.10)]">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            <div className="min-w-0">
              <div className="h-5 w-36 animate-pulse rounded bg-white/5" />
              <div className="mt-2 h-4 w-24 animate-pulse rounded bg-white/5" />
            </div>
          </div>
          <div className="h-8 w-28 animate-pulse rounded-full border border-white/10 bg-white/5" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          <div className="h-8 w-20 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          <div className="h-8 w-20 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-28 animate-pulse rounded bg-white/5" />
          <div className="h-10 w-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        </div>
      </div>
    </article>
  );
}

