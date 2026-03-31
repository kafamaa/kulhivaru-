import Link from "next/link";
import type { PublicTournamentCardData } from "@/src/features/tournaments/types";

interface UpcomingTournamentsSectionProps {
  tournaments: PublicTournamentCardData[];
  isLoading?: boolean;
}

export function UpcomingTournamentsSection({
  tournaments,
  isLoading = false,
}: UpcomingTournamentsSectionProps) {
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <div className="mb-3 h-6 w-48 animate-pulse rounded bg-slate-900/70" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl bg-slate-900/70"
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
            Upcoming tournaments
          </h2>
          <Link
            href="/explore?status=upcoming"
            className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
          >
            View all
          </Link>
        </div>

        {tournaments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 py-10 text-center text-sm text-slate-400">
            No upcoming tournaments yet. Organizers will add events soon.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/t/${t.slug}`}
                className="group flex flex-col rounded-2xl border border-white/10 bg-slate-950/50 transition-colors hover:border-emerald-400/40"
              >
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold">
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt="" className="h-full w-full rounded-lg object-cover" />
                      ) : (
                        t.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-medium text-slate-50">
                        {t.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {t.organizerName ?? "Kulhivaru+"}
                      </p>
                    </div>
                  </div>
                  {t.isRegistrationOpen && (
                    <span className="shrink-0 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      Registration Open
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{t.sport}</span>
                  {t.startDate && (
                    <time dateTime={t.startDate}>
                      Starts {new Date(t.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </time>
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
