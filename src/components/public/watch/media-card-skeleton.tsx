export function MediaCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md animate-pulse">
      <div className="relative aspect-video bg-slate-900/60">
        <div className="absolute left-3 top-3 h-6 w-28 rounded-full bg-slate-800" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full border border-white/10 bg-black/30" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-slate-900/60" />
        <div className="h-3 w-1/2 rounded bg-slate-900/60" />
      </div>
    </div>
  );
}

