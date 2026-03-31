import Link from "next/link";
import { getPlatformStats } from "@/src/features/stats/queries/get-platform-stats";
import { getTopScorersPreview } from "@/src/features/stats/queries/get-top-scorers-preview";
import {
  getTopAssistsPreview,
  type TopAssistPreview,
} from "@/src/features/stats/queries/get-top-assists-preview";
import {
  getTopPlayerCardsPreview,
  type TopPlayerCardsPreview,
} from "@/src/features/stats/queries/get-top-player-cards-preview";
import {
  getTeamCleanSheetsPreview,
  type TeamCleanSheetsPreview,
} from "@/src/features/stats/queries/get-team-clean-sheets-preview";
import { getStandingsPreview } from "@/src/features/standings/queries/get-standings-preview";
import { getFeaturedPlayer } from "@/src/features/players/queries/get-featured-player";
import { getFeaturedTeam } from "@/src/features/teams/queries/get-featured-team";
import { listPublicTournamentOptionsForStats } from "@/src/features/stats/queries/list-public-tournament-options";
import { StatsOverviewStrip } from "@/src/components/public/stats/stats-overview-strip";
import { StatsFilterToolbar } from "@/src/components/public/stats/stats-filter-toolbar";
import { StatsHubTabs, type StatsHubTab } from "@/src/components/public/stats/stats-tabs";
import { LeaderboardEmptyPanel } from "@/src/components/public/stats/leaderboard-empty-panel";

type SearchParamsValue = Record<string, string | string[] | undefined>;

function getString(sp: SearchParamsValue | undefined, key: string) {
  if (!sp) return undefined;
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function parseTab(input: string | undefined): StatsHubTab {
  if (
    input === "top-scorers" ||
    input === "assists" ||
    input === "team-rankings" ||
    input === "clean-sheets" ||
    input === "cards"
  ) {
    return input;
  }
  return "top-scorers";
}

function getLeaderboardTitle(tab: StatsHubTab) {
  switch (tab) {
    case "top-scorers":
      return "Top Scorers";
    case "assists":
      return "Assists";
    case "team-rankings":
      return "Team Rankings";
    case "clean-sheets":
      return "Clean Sheets";
    case "cards":
      return "Cards";
    default:
      return "Leaderboard";
  }
}

function getLeaderboardSubtitle(tab: StatsHubTab) {
  switch (tab) {
    case "top-scorers":
      return "Ranked by goal events.";
    case "assists":
      return "Ranked by assist events.";
    case "team-rankings":
      return "Ranked by standings cache points.";
    case "clean-sheets":
      return "Ranked by clean-sheet matches (CS).";
    case "cards":
      return "Ranked by yellow/red card events.";
    default:
      return "";
  }
}

function RankingRankBadge({ rank }: { rank: number }) {
  const isTop3 = rank === 1 || rank === 2 || rank === 3;
  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-xl border px-2 text-xs font-bold tabular-nums ${
        isTop3
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/5 text-slate-300"
      }`}
    >
      {rank}
    </span>
  );
}

export default async function StatsHubPage({
  searchParams,
}: {
  searchParams?:
    | Promise<SearchParamsValue | undefined>
    | SearchParamsValue
    | undefined;
}) {
  const sp = searchParams ? await searchParams : undefined;

  const tab = parseTab(getString(sp, "tab"));
  const tournament = getString(sp, "tournament");
  const category = getString(sp, "category");
  const scope = getString(sp, "scope") ?? "overall";

  try {
    const [
      platform,
      topScorers,
      standings,
      featuredPlayer,
      featuredTeam,
      tournamentOptions,
    ] = await Promise.all([
      getPlatformStats(),
      getTopScorersPreview(10),
      getStandingsPreview(10),
      getFeaturedPlayer(),
      getFeaturedTeam(),
      listPublicTournamentOptionsForStats(50),
    ]);

    const tournamentFilter =
      tournament && tournament !== "all" ? tournament : undefined;

    const [assistsLeaderboard, cardsLeaderboard, cleanSheetsLeaderboard] =
      await Promise.all([
        tab === "assists"
          ? getTopAssistsPreview(10, tournamentFilter)
          : Promise.resolve<TopAssistPreview[]>([]),
        tab === "cards"
          ? getTopPlayerCardsPreview(10, tournamentFilter)
          : Promise.resolve<TopPlayerCardsPreview[]>([]),
        tab === "clean-sheets"
          ? getTeamCleanSheetsPreview(10, tournamentFilter)
          : Promise.resolve<TeamCleanSheetsPreview[]>([]),
      ]);

    const rankedPlayersCount =
      tab === "top-scorers"
        ? topScorers.length
        : tab === "assists"
          ? assistsLeaderboard.length
          : tab === "cards"
            ? cardsLeaderboard.length
            : 0;

    const rankedTeamsCount =
      tab === "clean-sheets"
        ? cleanSheetsLeaderboard.length
        : standings.length;

    const topScorer =
      topScorers.length > 0
        ? {
            id: topScorers[0].id,
            name: topScorers[0].name,
            goals: topScorers[0].goals,
            teamName: topScorers[0].teamName,
          }
        : null;

    const topTeam =
      standings.length > 0
        ? {
            teamId: standings[0].teamId,
            teamName: standings[0].teamName,
            points: standings[0].points,
          }
        : null;

    const leaderboardTitle = getLeaderboardTitle(tab);
    const leaderboardSubtitle = getLeaderboardSubtitle(tab);

    return (
      <div className="space-y-6">
        {/* Header */}
        <section className="mx-auto max-w-7xl px-4 pt-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-50">
                  Stats Hub
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Track top scorers, assists, team rankings, and competition
                  leaders across tournaments.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  Ranked Players: {rankedPlayersCount > 0 ? rankedPlayersCount : 0}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  Teams: {rankedTeamsCount > 0 ? rankedTeamsCount : 0}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  Active Tournaments: {platform?.tournamentsHosted ?? 0}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Overview strip */}
        <StatsOverviewStrip
          platform={platform}
          topScorer={topScorer}
          topTeam={topTeam}
        />

        {/* Filters + tabs */}
        <StatsFilterToolbar
          activeTab={tab}
          tournamentOptions={tournamentOptions}
          initial={{
            tournament: tournament ?? undefined,
            category: category ?? undefined,
            scope,
          }}
        />
        <StatsHubTabs activeTab={tab} />

        {/* Main content + spotlight */}
        <section className="mx-auto max-w-7xl px-4 pb-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-50">
                      {leaderboardTitle}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {leaderboardSubtitle}
                    </p>
                  </div>
                  {(tournament || category || scope) && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {tournament ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                          Tournament: {tournament}
                        </span>
                      ) : null}
                      {category ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                          Category: {category}
                        </span>
                      ) : null}
                      {scope && scope !== "overall" ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                          Scope: {scope}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {tab === "top-scorers" && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
                  {topScorers.length === 0 ? (
                    <LeaderboardEmptyPanel
                      title="No stats available"
                      description="No top scorer data yet."
                    />
                  ) : (
                    <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
                      {topScorers.map((p, idx) => (
                        <div
                          key={p.id}
                          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <RankingRankBadge rank={idx + 1} />
                            <div className="min-w-0">
                              <Link
                                href={`/player/${p.id}`}
                                className="truncate text-sm font-semibold text-slate-50 hover:text-emerald-300"
                              >
                                {p.name}
                              </Link>
                              <p className="mt-1 truncate text-xs text-slate-400">
                                {p.teamName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-emerald-200 tabular-nums">
                              {p.goals}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              goals
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "assists" && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
                  {assistsLeaderboard.length === 0 ? (
                    <LeaderboardEmptyPanel
                      title="No assists data"
                      description="No assist events found for the selected filter."
                    />
                  ) : (
                    <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
                      {assistsLeaderboard.map((p, idx) => (
                        <div
                          key={`${p.playerId}-${p.tournamentSlug ?? "all"}`}
                          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <RankingRankBadge rank={idx + 1} />
                            <div className="min-w-0">
                              <Link
                                href={`/player/${p.playerId}`}
                                className="truncate text-sm font-semibold text-slate-50 hover:text-emerald-300"
                              >
                                {p.playerName}
                              </Link>
                              <p className="mt-1 truncate text-xs text-slate-400">
                                {p.teamName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-emerald-200 tabular-nums">
                              {p.assists}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              assists
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "team-rankings" && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
                  {standings.length === 0 ? (
                    <LeaderboardEmptyPanel
                      title="No stats available"
                      description="No standings cache data yet."
                    />
                  ) : (
                    <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
                      {standings.map((r, idx) => (
                        <div
                          key={`${r.teamId}-${r.rank}`}
                          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <RankingRankBadge rank={idx + 1} />
                            <div className="min-w-0">
                              <Link
                                href={`/team/${r.teamId}`}
                                className="truncate text-sm font-semibold text-slate-50 hover:text-emerald-300"
                              >
                                {r.teamName}
                              </Link>
                              <p className="mt-1 text-xs text-slate-400">
                                Played: {r.played}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-emerald-200 tabular-nums">
                              {r.points}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              points
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {tournament && tournament !== "all" ? (
                    <p className="mt-3 text-xs text-amber-200">
                      Tournament filter is limited for MVP on this page. Team
                      rankings use cached preview data.
                    </p>
                  ) : null}
                </div>
              )}

              {tab === "cards" && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
                  {cardsLeaderboard.length === 0 ? (
                    <LeaderboardEmptyPanel
                      title="No cards data"
                      description="No card events found for the selected filter."
                    />
                  ) : (
                    <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
                      {cardsLeaderboard.map((p, idx) => (
                        <div
                          key={`${p.playerId}-${p.tournamentSlug ?? "all"}`}
                          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <RankingRankBadge rank={idx + 1} />
                            <div className="min-w-0">
                              <Link
                                href={`/player/${p.playerId}`}
                                className="truncate text-sm font-semibold text-slate-50 hover:text-emerald-300"
                              >
                                {p.playerName}
                              </Link>
                              <p className="mt-1 truncate text-xs text-slate-400">
                                {p.teamName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-bold text-emerald-200 tabular-nums">
                                {p.yellowCards}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-400">
                                yellow
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-rose-200 tabular-nums">
                                {p.redCards}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-400">
                                red
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "clean-sheets" && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
                  {cleanSheetsLeaderboard.length === 0 ? (
                    <LeaderboardEmptyPanel
                      title="No clean sheets data"
                      description="No completed matches with clean sheets found."
                    />
                  ) : (
                    <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
                      {cleanSheetsLeaderboard.map((t, idx) => (
                        <div
                          key={`${t.teamId}-${t.tournamentSlug ?? "all"}`}
                          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <RankingRankBadge rank={idx + 1} />
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                              {t.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={t.logoUrl}
                                  alt={`${t.teamName} logo`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-slate-300">
                                  T
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/team/${t.teamId}`}
                                className="truncate text-sm font-semibold text-slate-50 hover:text-emerald-300"
                              >
                                {t.teamName}
                              </Link>
                              <p className="mt-1 text-xs text-slate-400">
                                Clean sheets
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-emerald-200 tabular-nums">
                              {t.cleanSheets}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              CS
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Spotlight */}
            <aside className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
                <h2 className="text-lg font-semibold text-slate-50">
                  Featured Performers
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  A quick spotlight from the current public snapshot.
                </p>

                <div className="mt-4 space-y-3">
                  {featuredPlayer ? (
                    <Link
                      href={`/player/${featuredPlayer.id}`}
                      className="block rounded-2xl border border-white/10 bg-white/5 p-3 hover:border-emerald-400/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-slate-200">
                          {featuredPlayer.imageUrl
                            ? "P"
                            : featuredPlayer.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-50">
                            {featuredPlayer.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {featuredPlayer.teamName ?? "Team"} ·{" "}
                            {featuredPlayer.goals} goals
                          </div>
                        </div>
                      </div>
                    </Link>
                  ) : null}

                  {featuredTeam ? (
                    <Link
                      href={`/team/${featuredTeam.id}`}
                      className="block rounded-2xl border border-white/10 bg-white/5 p-3 hover:border-emerald-400/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-slate-200">
                          T
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-50">
                            {featuredTeam.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {featuredTeam.tournamentName ?? "Tournament"} ·{" "}
                            {featuredTeam.points} pts
                          </div>
                        </div>
                      </div>
                    </Link>
                  ) : null}

                  {topScorer ? (
                    <Link
                      href={`/player/${topScorer.id}`}
                      className="block rounded-2xl border border-white/10 bg-white/5 p-3 hover:border-emerald-400/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-400">
                            Leading scorer
                          </div>
                          <div className="truncate text-sm font-semibold text-slate-50">
                            {topScorer.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald-200 tabular-nums">
                            {topScorer.goals}
                          </div>
                          <div className="text-xs text-slate-400">goals</div>
                        </div>
                      </div>
                    </Link>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-10 text-center backdrop-blur-md">
          <h1 className="text-2xl font-semibold text-red-100">Couldn’t load stats</h1>
          <p className="mt-2 text-sm text-red-200/90">{message}</p>
          <div className="mt-7 flex justify-center">
            <Link
              href="/stats"
              className="inline-flex items-center rounded-2xl bg-red-500/20 border border-red-400/30 px-6 py-3 text-sm font-semibold text-red-100 hover:bg-red-500/25"
            >
              Retry
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

