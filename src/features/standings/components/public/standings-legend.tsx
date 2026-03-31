export function StandingsLegend() {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200">
        <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
        Qualified
      </div>
      <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200">
        <span className="h-3 w-3 rounded-full bg-amber-400/70" />
        Playoff
      </div>
      <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200">
        <span className="h-3 w-3 rounded-full bg-rose-400/60" />
        Eliminated
      </div>
    </div>
  );
}

