export function TieBreakExplanation() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <h3 className="text-sm font-semibold text-slate-50">Tie-break rules</h3>
      <p className="mt-2 text-sm text-slate-400">
        Teams are ranked by <span className="text-slate-200 font-semibold">Points</span> →{" "}
        <span className="text-slate-200 font-semibold">Goal Difference</span> →{" "}
        <span className="text-slate-200 font-semibold">Goals For</span>. If still tied, use
        the cached rank from the standings calculator.
      </p>
    </div>
  );
}

