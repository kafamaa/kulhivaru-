import type { MatchCenterView } from "@/src/features/matches/queries/list-public-matches-center";

export function MatchCardSkeleton({ view }: { view: MatchCenterView }) {
  if (view === "list") {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md animate-pulse">
        <div className="h-5 w-44 rounded bg-slate-900/70" />
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-900/70" />
            <div className="h-4 w-40 rounded bg-slate-900/70" />
          </div>
          <div className="h-24 w-28 rounded-2xl bg-slate-900/70" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-900/70" />
            <div className="h-4 w-28 rounded bg-slate-900/70" />
          </div>
        </div>
        <div className="mt-4 h-4 w-56 rounded bg-slate-900/70" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-md animate-pulse">
      <div className="h-24 bg-slate-900/70" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-slate-900/70" />
        <div className="h-4 w-2/3 rounded bg-slate-900/70" />
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded bg-slate-900/70" />
          <div className="h-4 w-24 rounded bg-slate-900/70" />
        </div>
      </div>
    </div>
  );
}

