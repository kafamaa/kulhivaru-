import Image from "next/image";
import Link from "next/link";
import type { PublicMatchPreview } from "@/src/features/matches/types";

interface LiveMatchesSectionProps {
  matches: PublicMatchPreview[];
  isLoading?: boolean;
}

export function LiveMatchesSection({
  matches,
  isLoading = false,
}: LiveMatchesSectionProps) {
  const initials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
              Live Now
            </span>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 min-w-[220px] animate-pulse rounded-2xl bg-slate-900/70"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-200">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            Live Now
          </span>
          <Link
            href="/matches?filter=live"
            className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
          >
            View all live matches
          </Link>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 px-4 py-10 text-center text-sm text-slate-400">
            No live matches right now. When tournaments are in play, key fixtures
            will appear here.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {matches.map((m) => (
              <Link
                key={m.id}
                href={`/t/${m.tournamentSlug}`}
                className="flex min-w-[240px] shrink-0 flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition-colors hover:border-emerald-400/40"
              >
                <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-400">
                  <span className="truncate">{m.tournamentName}</span>
                  <span className="rounded-full border border-white/10 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-200">
                    {m.statusLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-[9px] font-bold text-slate-200">
                      {m.homeTeamLogoUrl ? (
                        <Image src={m.homeTeamLogoUrl} alt={m.homeTeam} fill className="object-cover" />
                      ) : (
                        initials(m.homeTeam)
                      )}
                    </span>
                    <span className="truncate text-sm font-semibold text-slate-50">
                      {m.homeTeam}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-50">
                    {m.score ?? "–"}
                  </span>
                  <span className="flex min-w-0 items-center justify-end gap-2">
                    <span className="truncate text-right text-sm font-semibold text-slate-50">
                      {m.awayTeam}
                    </span>
                    <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-[9px] font-bold text-slate-200">
                      {m.awayTeamLogoUrl ? (
                        <Image src={m.awayTeamLogoUrl} alt={m.awayTeam} fill className="object-cover" />
                      ) : (
                        initials(m.awayTeam)
                      )}
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
