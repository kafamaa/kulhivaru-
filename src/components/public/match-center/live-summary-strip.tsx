import Link from "next/link";
import type { MatchCenterSummary } from "@/src/features/matches/queries/list-public-matches-center";

export function LiveSummaryStrip({ summary }: { summary: MatchCenterSummary }) {
  const hasLive = summary.liveCount > 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-2">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {hasLive ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-100">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                {summary.liveCount} matches live now
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                {summary.activeTournaments} tournaments active
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                No live matches right now
              </span>
              {summary.nextKickoffAt ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  Next kickoff at{" "}
                  <span className="font-mono">
                    {new Date(summary.nextKickoffAt).toISOString().slice(11, 16)} UTC
                  </span>
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  Check today&apos;s schedule
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Link
              href={hasLive ? "/matches?tab=live" : "/matches?tab=today"}
              className={hasLive
                ? "inline-flex items-center rounded-2xl bg-red-500/15 border border-red-400/30 px-4 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/25"
                : "inline-flex items-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25"
              }
            >
              {hasLive ? "Switch to Live" : "See today’s matches"} →
            </Link>
            <Link
              href="/watch"
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              Watch →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

