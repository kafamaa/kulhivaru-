export function TournamentCardSkeleton({ variant }: { variant: "grid" | "list" }) {
  if (variant === "list") {
    return (
      <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="flex gap-4">
          <div className="h-20 w-28 rounded-xl bg-slate-900/70 animate-pulse" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-4 w-3/4 rounded bg-slate-900/70 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-slate-900/70 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-5 w-24 rounded-full bg-slate-900/70 animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-slate-900/70 animate-pulse" />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-md">
      <div className="h-28 bg-slate-900/70 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-4/5 rounded bg-slate-900/70 animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-slate-900/70 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-5 w-24 rounded-full bg-slate-900/70 animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-slate-900/70 animate-pulse" />
        </div>
      </div>
    </article>
  );
}

