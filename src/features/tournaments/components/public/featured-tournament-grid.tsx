import Link from "next/link";
import type { PublicTournamentCardData } from "../../types";

interface FeaturedTournamentGridProps {
  tournaments: PublicTournamentCardData[];
}

export function FeaturedTournamentGrid({
  tournaments,
}: FeaturedTournamentGridProps) {
  if (tournaments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950 p-6 text-sm text-slate-400 text-center">
        No featured tournaments yet. Once organizers publish, they&apos;ll
        appear here automatically.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {tournaments.map((t) => (
        <article
          key={t.id}
          className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 hover:border-emerald-500/70 transition-colors"
        >
          {t.coverImageUrl && (
            <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
              <img
                src={t.coverImageUrl}
                alt={t.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-slate-950/10" />
            </div>
          )}

          <Link href={`/t/${t.slug}`} className="relative flex flex-col h-full p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-xs font-semibold">
                {t.logoUrl ? (
                  <img
                    src={t.logoUrl}
                    alt={t.name}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  t.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-50">
                  {t.name}
                </h3>
                <p className="truncate text-[11px] text-slate-300">
                  {t.location ?? "Location TBA"}
                </p>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between text-[11px] text-slate-300">
              <span className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                {t.sport}
              </span>
              <span className="uppercase tracking-wide text-slate-400">
                {t.status}
              </span>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}

