import Link from "next/link";
import type { PublicTournamentCardData } from "@/src/features/tournaments/types";

interface OngoingTournamentsSectionProps {
  tournaments: PublicTournamentCardData[];
  isLoading?: boolean;
}

export function OngoingTournamentsSection({
  tournaments,
  isLoading = false,
}: OngoingTournamentsSectionProps) {
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <div className="mb-3 h-6 w-48 animate-pulse rounded bg-slate-900/70" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 min-w-[280px] animate-pulse rounded-2xl bg-slate-900/70"
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
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-50">
            Ongoing tournaments
          </h2>
          <Link
            href="/explore?status=ongoing"
            className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
          >
            View all tournaments
          </Link>
        </div>

        {tournaments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 py-10 text-center text-sm text-slate-400">
            No ongoing tournaments at the moment. Check back soon or explore
            upcoming events.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/t/${t.slug}`}
                className="group relative flex min-w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 transition-colors hover:border-emerald-400/40"
              >
              {t.coverImageUrl && (
                <div className="absolute inset-0 opacity-40 group-hover:opacity-50">
                  <img
                    src={t.coverImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                </div>
              )}
              <div className="relative flex flex-1 flex-col p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-xl border border-slate-700 bg-slate-900/90 flex items-center justify-center text-xs font-bold">
                    {t.logoUrl ? (
                      <img src={t.logoUrl} alt="" className="h-full w-full rounded-xl object-cover" />
                    ) : (
                      t.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-50">
                      {t.name}
                    </h3>
                    <p className="truncate text-xs text-slate-400">
                      {t.organizerName ?? "Kulhivaru+"}
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs">
                  <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                    {t.status}
                  </span>
                  {t.teamCount != null && (
                    <span className="text-slate-400">
                      {t.teamCount} teams
                    </span>
                  )}
                </div>
              </div>
            </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
