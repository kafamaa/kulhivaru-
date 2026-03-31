import Link from "next/link";

import { TournamentSubNav } from "@/src/features/tournaments/components/public/tournament-overview/tournament-sub-nav";
import {
  getPublicTournamentStats,
  type TournamentStatsTab,
} from "@/src/features/tournaments/queries/get-public-tournament-stats";

import { TournamentStatsFilterBar } from "@/src/features/tournaments/components/public/tournament-stats/stats-filter-bar";
import { TournamentStatsTabs } from "@/src/features/tournaments/components/public/tournament-stats/stats-tabs";
import { SpotlightCards } from "@/src/features/tournaments/components/public/tournament-stats/spotlight-cards";
import { PlayerLeaderboardPanel } from "@/src/features/tournaments/components/public/tournament-stats/player-leaderboard-panel";
import { TeamStatsPanel } from "@/src/features/tournaments/components/public/tournament-stats/team-stats-panel";

type SearchParamsValue = Record<string, string | string[] | undefined>;

function getString(sp: SearchParamsValue | undefined, key: string) {
  if (!sp) return undefined;
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function parseTab(input: string | undefined): TournamentStatsTab {
  if (
    input === "top-scorers" ||
    input === "assists" ||
    input === "clean-sheets" ||
    input === "cards" ||
    input === "team-stats"
  ) {
    return input;
  }
  return "top-scorers";
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ongoing"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : status === "upcoming"
        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
        : status === "completed"
          ? "border-white/10 bg-white/5 text-slate-300"
          : "border-white/10 bg-white/5 text-slate-300";

  const label = status === "ongoing" ? "Ongoing" : status === "upcoming" ? "Upcoming" : "Completed";

  return (
    <span className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

interface TournamentStatsPageProps {
  params: Promise<{ slug: string }>;
  searchParams?:
    | Promise<SearchParamsValue | undefined>
    | SearchParamsValue
    | undefined;
}

export default async function TournamentStatsPage({
  params,
  searchParams,
}: TournamentStatsPageProps) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : undefined;

  const tab = parseTab(getString(sp, "tab"));
  const phaseKey = getString(sp, "phase");
  const groupKeyRaw = getString(sp, "group");

  const filters = {
    phaseKey: phaseKey && phaseKey !== "all" ? phaseKey : null,
    groupKey: groupKeyRaw && groupKeyRaw !== "overall" ? groupKeyRaw : null,
    category: null as string | null,
  };

  try {
    const payload = await getPublicTournamentStats({
      slug,
      tab,
      filters,
      limit: 10,
    });

    const playedMatches = payload.summary.playedMatches;
    const totalGoals = payload.summary.totalGoals;
    const totalPlayers = payload.summary.totalPlayers;

    const leaderboardEmpty =
      (tab === "clean-sheets" || tab === "team-stats") ? payload.teamLeaderboard.length === 0 : payload.playerLeaderboard.length === 0;

    return (
      <div className="space-y-6">
        {/* 2. Tournament Header (compact) */}
        <section className="mx-auto max-w-7xl px-4 pt-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/t/${slug}`}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
                  >
                    ← Overview
                  </Link>
                  <span className="truncate text-sm font-semibold text-slate-50">
                    Tournament Stats · {payload.tournament.name}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-200">
                    {playedMatches} matches played
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-200">
                    {totalGoals} goals
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-200">
                    {totalPlayers} players
                  </span>
                </div>
              </div>

              <div>
                <StatusBadge status={payload.tournament.status} />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Tournament Sub-navigation */}
        <TournamentSubNav slug={slug} active="stats" />

        {/* 4. Stats Header + Summary */}
        <section className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-50">Tournament Stats</h2>
              <p className="mt-1 text-sm text-slate-400">
                Performance rankings powered by match events + results.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Filters Toolbar (sticky) */}
        <TournamentStatsFilterBar
          slug={slug}
          initial={{
            phaseKey: filters.phaseKey,
            groupKey: filters.groupKey,
            category: null,
          }}
          phaseOptions={payload.phaseOptions}
          groupOptions={payload.groupOptions}
        />

        {/* 6. Leaderboard Tabs */}
        <TournamentStatsTabs activeTab={tab} />

        {/* 7. Main leaderboards + spotlight */}
        <section className="mx-auto max-w-7xl px-4 pb-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {leaderboardEmpty ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.18)] text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <span className="text-xl">★</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-50">
                    No stats available yet
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Matches need to be played to generate standings and performance rankings.
                  </p>
                </div>
              ) : null}

              {tab === "top-scorers" ? (
                <PlayerLeaderboardPanel
                  title="Top Scorers"
                  rows={payload.playerLeaderboard}
                  emptyTitle="No top scorers data"
                  emptyDescription="Goal events not found for this scope."
                  valueRenderer={(r) => (
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-200 tabular-nums">
                        {r.goals}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400">
                        goals
                      </div>
                    </div>
                  )}
                />
              ) : null}

              {tab === "assists" ? (
                <PlayerLeaderboardPanel
                  title="Assists"
                  rows={payload.playerLeaderboard}
                  emptyTitle="No assists data"
                  emptyDescription="Assist events not found for this scope."
                  valueRenderer={(r) => (
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-200 tabular-nums">
                        {r.assists}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400">
                        assists
                      </div>
                    </div>
                  )}
                />
              ) : null}

              {tab === "cards" ? (
                <PlayerLeaderboardPanel
                  title="Cards"
                  rows={payload.playerLeaderboard}
                  emptyTitle="No cards data"
                  emptyDescription="Card events not found for this scope."
                  valueRenderer={(r) => (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-200 tabular-nums">
                          {r.yellowCards}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400">
                          yellow
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-rose-200 tabular-nums">
                          {r.redCards}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400">
                          red
                        </div>
                      </div>
                    </div>
                  )}
                />
              ) : null}

              {tab === "clean-sheets" ? (
                <TeamStatsPanel
                  title="Clean Sheets"
                  rows={payload.teamLeaderboard}
                  emptyTitle="No clean sheets data"
                  emptyDescription="Clean-sheet matches not found for this scope."
                  valueLabel={(r) => ({
                    value: r.cleanSheets,
                    label: "CS",
                    valueClassName: "text-sm font-bold text-emerald-200 tabular-nums",
                  })}
                />
              ) : null}

              {tab === "team-stats" ? (
                <TeamStatsPanel
                  title="Team Stats"
                  rows={payload.teamLeaderboard}
                  emptyTitle="No team stats data"
                  emptyDescription="Not enough finished matches yet for this scope."
                  valueLabel={(r) => ({
                    value: r.points,
                    label: "Pts",
                    valueClassName: "text-sm font-bold text-emerald-200 tabular-nums",
                  })}
                />
              ) : null}

              {/* 8. Team Stats Section */}
              {tab !== "team-stats" ? (
                <TeamStatsPanel
                  title="Teams: Best by Points"
                  rows={payload.teamLeaderboard}
                  valueLabel={(r) => ({
                    value: r.points,
                    label: "Pts",
                    valueClassName: "text-sm font-bold text-emerald-200 tabular-nums",
                  })}
                  emptyTitle="No team comparison available"
                  emptyDescription="Team rankings are generated after matches are played."
                />
              ) : null}
            </div>

            {/* Spotlight */}
            <div>
              <SpotlightCards spotlight={payload.spotlight} />
            </div>
          </div>
        </section>
      </div>
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return (
      <div className="mx-auto max-w-5xl px-4 pt-12 pb-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-400/20 bg-red-500/10 p-10 text-center backdrop-blur-md">
          <h3 className="text-2xl font-semibold text-red-100">Couldn&apos;t load stats</h3>
          <p className="mt-2 text-sm text-red-200/90">{message}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center rounded-2xl bg-red-500/20 border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25"
            >
              Retry
            </button>
            <Link
              href={`/t/${slug}`}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

