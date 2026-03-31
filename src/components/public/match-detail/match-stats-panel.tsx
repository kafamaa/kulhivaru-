import type { PublicMatchDetail } from "@/src/features/matches/public/queries/get-public-match-detail";
import type { MatchStatsDerived } from "@/src/features/matches/public/lib/derive-match-stats";

import Image from "next/image";
import Link from "next/link";

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-50 tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function MatchStatsPanel({
  match,
  stats,
}: {
  match: PublicMatchDetail;
  stats: MatchStatsDerived;
}) {
  const isEmpty =
    stats.home.eventsTotal === 0 && stats.away.eventsTotal === 0;

  return (
    <section className="mx-auto max-w-7xl px-4" aria-label="Match stats">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.14)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Match Stats</h2>
            <p className="mt-1 text-sm text-slate-400">
              Computed from logged match events (goals/cards/subs).
            </p>
          </div>
          {match.status === "ft" || match.status === "completed" ? (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-center">
              <div className="text-[11px] font-semibold text-emerald-200">
                Final Score
              </div>
              <div className="mt-1 text-xl font-bold text-slate-50 tabular-nums">
                {match.scoreText ?? "—"}
              </div>
            </div>
          ) : null}
        </div>

        {isEmpty ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
            No stats yet.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <TeamStatsCard
              match={match}
              teamSide="home"
              stats={stats.home}
            />
            <TeamStatsCard
              match={match}
              teamSide="away"
              stats={stats.away}
            />
          </div>
        )}

        <div className="mt-4 text-xs text-slate-500">
          Events shown in the timeline drive these counts.
        </div>
      </div>
    </section>
  );
}

function TeamStatsCard({
  match,
  teamSide,
  stats,
}: {
  match: PublicMatchDetail;
  teamSide: "home" | "away";
  stats: MatchStatsDerived["home"];
}) {
  const team = teamSide === "home" ? match.home : match.away;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {team?.logoUrl ? (
              <Image src={team.logoUrl} alt="" fill className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm font-bold text-slate-300">
                {team?.teamName?.slice(0, 1).toUpperCase() ?? "T"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            {team?.teamId ? (
              <Link
                href={`/team/${team.teamId}`}
                className="block truncate text-sm font-semibold text-slate-50 hover:text-emerald-300"
              >
                {team?.teamName ?? "TBD"}
              </Link>
            ) : (
              <div className="block truncate text-sm font-semibold text-slate-50">
                {team?.teamName ?? "TBD"}
              </div>
            )}
            <div className="text-[11px] text-slate-400">
              {teamSide === "home" ? "Home" : "Away"}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-[11px] font-semibold text-slate-400">Events</div>
          <div className="mt-1 text-lg font-bold text-slate-50 tabular-nums">
            {stats.eventsTotal}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <StatRow label="Goals" value={stats.goals} />
        <StatRow label="Assists" value={stats.assists} />
        <StatRow label="Yellow cards" value={stats.yellowCards} />
        <StatRow label="Red cards" value={stats.redCards} />
        <StatRow label="Substitutions in" value={stats.substitutionsIn} />
        <StatRow label="Substitutions out" value={stats.substitutionsOut} />
      </div>
    </div>
  );
}

