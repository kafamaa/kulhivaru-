export function TournamentMediaCardSkeleton() {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div className="relative aspect-video rounded-2xl border border-white/10 bg-white/5">
        <div className="absolute left-4 top-4 h-6 w-24 animate-pulse rounded-full bg-white/5" />
      </div>
      <div className="mt-3 space-y-3">
        <div className="h-5 w-4/5 animate-pulse rounded bg-white/5" />
        <div className="flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded bg-white/5" />
          <div className="h-6 w-18 animate-pulse rounded bg-white/5" />
        </div>
      </div>
    </article>
  );
}

