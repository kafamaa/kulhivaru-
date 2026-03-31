import Image from "next/image";
import Link from "next/link";

import type { PublicMatchDetail } from "@/src/features/matches/public/queries/get-public-match-detail";

export function MatchHeaderScoreboard({
  match,
}: {
  match: PublicMatchDetail;
}) {
  const isLive = match.status === "live";
  const isFinished = match.status === "ft" || match.status === "completed";

  const badge = (() => {
    if (isLive) {
      const minute = match.liveMinute != null ? `${match.liveMinute}'` : "";
      return (
        <span className="inline-flex items-center rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-[11px] font-bold text-red-100 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
          LIVE {minute ? minute : ""}
        </span>
      );
    }
    if (isFinished) {
      return (
        <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-[11px] font-bold text-emerald-200 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
          FT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-300 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
        Upcoming
      </span>
    );
  })();

  const scoreLabel = isFinished
    ? match.scoreText ?? "0 - 0"
    : isLive
      ? match.scoreText ?? "—"
      : "—";

  const kickoffLabel = match.scheduledAt
    ? new Date(match.scheduledAt).toLocaleString()
    : "Kickoff TBD";

  const roundLine = match.roundLabel ? ` · ${match.roundLabel}` : "";

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_25px_100px_rgba(0,0,0,0.35)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {match.home?.logoUrl ? (
                <Image
                  src={match.home.logoUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm font-bold text-slate-300">
                  {match.home?.teamName?.slice(0, 1).toUpperCase() ?? "T"}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/team/${match.home?.teamId ?? ""}`}
                className="block truncate text-sm font-semibold text-slate-50 hover:text-emerald-300"
              >
                {match.home?.teamName ?? "TBD"}
              </Link>
              <div className="mt-1 text-[11px] text-slate-400">Home</div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-3">
            {badge}
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Score
              </div>
              <div className="mt-1 text-3xl font-bold text-slate-50 tabular-nums">
                {scoreLabel}
              </div>
              {!isFinished && !isLive ? (
                <div className="mt-2 text-xs text-slate-400">{kickoffLabel}</div>
              ) : null}
            </div>
            <div className="text-xs text-slate-400">
              {kickoffLabel}
              {roundLine}
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-0 lg:justify-end">
            <div className="min-w-0 text-right">
              <Link
                href={`/team/${match.away?.teamId ?? ""}`}
                className="block truncate text-sm font-semibold text-slate-50 hover:text-emerald-300"
              >
                {match.away?.teamName ?? "TBD"}
              </Link>
              <div className="mt-1 text-[11px] text-slate-400">Away</div>
            </div>
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {match.away?.logoUrl ? (
                <Image
                  src={match.away.logoUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm font-bold text-slate-300">
                  {match.away?.teamName?.slice(0, 1).toUpperCase() ?? "T"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-400">
            Tournament{" "}
            <Link
              href={`/t/${match.tournamentSlug}`}
              className="font-semibold text-slate-200 hover:text-emerald-300"
            >
              {match.tournamentName}
            </Link>
          </div>
          <div className="text-sm text-slate-400">
            {match.tournamentSport}
          </div>
        </div>
      </div>
    </section>
  );
}

