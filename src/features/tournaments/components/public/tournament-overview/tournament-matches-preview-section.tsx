import Link from "next/link";
import { MatchCard } from "@/src/components/public/match-center/match-card";
import type { PublicMatchCenterItem } from "@/src/features/matches/queries/list-public-matches-center";

export function TournamentMatchesPreviewSection({
  slug,
  title,
  description,
  emptyText,
  matches,
  variant,
  showViewAll = true,
}: {
  slug: string;
  title: string;
  description: string;
  emptyText: string;
  matches: PublicMatchCenterItem[];
  variant: "upcoming" | "completed";
  showViewAll?: boolean;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
        {showViewAll ? (
          <Link
            href={`/t/${slug}/fixtures`}
            className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
          >
            View All →
          </Link>
        ) : null}
      </div>

      {matches.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-white/15 bg-white/[0.06] p-6 text-sm text-slate-400 backdrop-blur-xl">
          {emptyText}
        </div>
      ) : (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:gap-3 md:overflow-x-visible">
          {matches.map((m) => (
            <div key={m.id} className="min-w-[320px] md:min-w-0">
              <MatchCard match={m} variant={variant} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
