import Link from "next/link";
import { MatchCard } from "@/src/components/public/match-center/match-card";
import type { PublicMatchCenterItem } from "@/src/features/matches/queries/list-public-matches-center";

function MatchListCard({
  title,
  description,
  emptyText,
  matches,
  variant,
}: {
  title: string;
  description: string;
  emptyText: string;
  matches: PublicMatchCenterItem[];
  variant: "upcoming" | "completed";
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 text-xs text-slate-400">{description}</p>

      {matches.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {matches.slice(0, 3).map((m) => (
            <MatchCard key={m.id} match={m} variant={variant} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TournamentMatchCenterBand({
  slug,
  upcomingMatches,
  recentResults,
}: {
  slug: string;
  upcomingMatches: PublicMatchCenterItem[];
  recentResults: PublicMatchCenterItem[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Match Center</h2>
          <p className="mt-1 text-sm text-slate-400">
            Upcoming fixtures and recent final results.
          </p>
        </div>
        <Link
          href={`/t/${slug}/fixtures`}
          className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
        >
          Open full fixtures →
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MatchListCard
          title="Upcoming Matches"
          description="What is scheduled next."
          emptyText="No upcoming matches found right now."
          matches={upcomingMatches}
          variant="upcoming"
        />
        <MatchListCard
          title="Recent Results"
          description="Latest completed fixtures."
          emptyText="No recent results available yet."
          matches={recentResults}
          variant="completed"
        />
      </div>
    </section>
  );
}
