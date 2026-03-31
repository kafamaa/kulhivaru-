import Link from "next/link";
import Image from "next/image";

import type { PublicMatchCenterItem } from "@/src/features/matches/queries/list-public-matches-center";

export function FeaturedMatchCard({ match }: { match: PublicMatchCenterItem }) {
  const isLive = match.status === "live";

  const accentClass = isLive
    ? "border-red-400/30 bg-red-500/5 shadow-[0_18px_70px_rgba(239,68,68,0.14)]"
    : "border-white/10 bg-white/5";

  const score = match.scoreText ?? "—";

  return (
    <article
      className={`rounded-3xl border p-5 backdrop-blur-md ${accentClass}`}
      aria-label={`Featured match ${match.home?.teamName ?? ""} vs ${match.away?.teamName ?? ""}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
              {match.tournamentName}
            </span>
            {match.roundLabel ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-slate-200">
                {match.roundLabel}
              </span>
            ) : null}
            {match.location ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-slate-200">
                {match.location}
              </span>
            ) : null}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {match.home?.logoUrl ? (
                  <Image
                    src={match.home.logoUrl}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-sm font-bold text-slate-300">
                    {match.home?.teamName?.slice(0, 1).toUpperCase() ?? "T"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-50">
                  {match.home?.teamName ?? "TBD"}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">Home</div>
              </div>
            </div>

            <div className="text-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs font-medium text-slate-400">
                  Score
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-50 tabular-nums">
                  {score}
                </div>
              </div>
              {isLive && match.liveMinute != null ? (
                <div className="mt-2 text-xs font-semibold text-red-100">
                  {match.statusLabel}
                </div>
              ) : (
                <div className="mt-2 text-xs font-semibold text-slate-300">
                  {match.statusLabel}
                </div>
              )}
            </div>

            <div className="flex min-w-0 items-center justify-end gap-3 sm:justify-start">
              <div className="min-w-0 text-left">
                <div className="truncate text-sm font-semibold text-slate-50">
                  {match.away?.teamName ?? "TBD"}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">Away</div>
              </div>
              <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {match.away?.logoUrl ? (
                  <Image
                    src={match.away.logoUrl}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-sm font-bold text-slate-300">
                    {match.away?.teamName?.slice(0, 1).toUpperCase() ?? "T"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
            <Link
              href={`/match/${match.id}`}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              View Match
            </Link>
            {isLive ? (
              <Link
                href="/watch"
                className="inline-flex items-center rounded-2xl bg-red-500/15 border border-red-400/30 px-4 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/25"
              >
                Watch →
              </Link>
            ) : null}
          </div>

          {match.scheduledAt ? (
            <div className="text-xs text-slate-400">
              Starts{" "}
              <span className="font-semibold text-slate-300 tabular-nums">
                {new Date(match.scheduledAt).toISOString().slice(11, 16)} UTC
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

