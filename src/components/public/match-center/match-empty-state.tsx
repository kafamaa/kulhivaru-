import Link from "next/link";
import type { MatchCenterTab } from "@/src/features/matches/queries/list-public-matches-center";

export function MatchEmptyState({
  tab,
}: {
  tab: MatchCenterTab;
}) {
  const isLiveTab = tab === "live";

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
        <span className="text-2xl">{isLiveTab ? "•" : "⌁"}</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold text-slate-50">
        {isLiveTab ? "No live matches right now" : "No matches found"}
      </h3>
      <p className="mt-2 text-sm text-slate-400">
        {isLiveTab
          ? "When tournaments go live, key fixtures will appear here instantly."
          : "Try another date, tournament, or status filter."}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link
          href="/matches"
          className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Clear filters
        </Link>
        <Link
          href="/matches?tab=today"
          className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
        >
          Go to today&apos;s matches
        </Link>
      </div>
    </div>
  );
}

