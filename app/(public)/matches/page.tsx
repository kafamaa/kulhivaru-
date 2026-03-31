import { Suspense } from "react";
import Link from "next/link";
import { listMatchCenterTournamentOptions, listPublicMatchesCenter, getMatchCenterSummary, type MatchCenterStatusFilter, type MatchCenterTab, type MatchCenterTournamentOption, type MatchCenterView } from "@/src/features/matches/queries/list-public-matches-center";
import { LiveSummaryStrip } from "@/src/components/public/match-center/live-summary-strip";
import { MatchCenterToolbar } from "@/src/components/public/match-center/match-center-toolbar";
import { MatchCard } from "@/src/components/public/match-center/match-card";
import { MatchCardSkeleton } from "@/src/components/public/match-center/match-card-skeleton";
import { MatchEmptyState } from "@/src/components/public/match-center/match-empty-state";
import { MatchErrorState } from "@/src/components/public/match-center/match-error-state";
import type { PublicMatchCenterItem } from "@/src/features/matches/queries/list-public-matches-center";

type SearchParamsValue = Record<string, string | string[] | undefined>;

function getString(sp: SearchParamsValue | undefined, key: string): string | undefined {
  if (!sp) return undefined;
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function parseTab(input: string | undefined): MatchCenterTab | undefined {
  if (input === "live" || input === "today" || input === "results" || input === "upcoming") return input;
  return undefined;
}

function parseView(input: string | undefined): MatchCenterView {
  if (input === "list" || input === "grid") return input;
  return "grid";
}

function parseStatusFilter(input: string | undefined): MatchCenterStatusFilter | undefined {
  if (input === "all" || input === "live" || input === "scheduled" || input === "completed") return input;
  return undefined;
}

function defaultStatusForTab(tab: MatchCenterTab): MatchCenterStatusFilter {
  if (tab === "live") return "live";
  if (tab === "results") return "completed";
  if (tab === "upcoming") return "scheduled";
  return "all";
}

function defaultDateForTab(tab: MatchCenterTab): string {
  if (tab === "upcoming") return "tomorrow";
  return "today";
}

function getStatusVariantForCard(tab: MatchCenterTab, match: PublicMatchCenterItem) {
  if (match.status === "live") return "live";
  if (match.status === "ft" || match.status === "completed") return "completed";
  if (match.status === "scheduled") return tab === "upcoming" ? "upcoming" : "scheduled";
  return tab === "upcoming" ? "upcoming" : "scheduled";
}

function buildLoadMoreHref(params: {
  tab: MatchCenterTab;
  date: string;
  tournament?: string;
  sport?: string;
  status: MatchCenterStatusFilter;
  view: MatchCenterView;
  nextPage: number;
}) {
  const sp = new URLSearchParams();
  if (params.tab) sp.set("tab", params.tab);
  if (params.date) sp.set("date", params.date);
  if (params.tournament) sp.set("tournament", params.tournament);
  if (params.sport && params.sport !== "all") sp.set("sport", params.sport);
  if (params.status && params.status !== "all") sp.set("status", params.status);
  sp.set("view", params.view);
  sp.set("page", String(params.nextPage));
  return `/matches?${sp.toString()}`;
}

async function MatchesResults({
  tab,
  date,
  tournament,
  sport,
  status,
  view,
  page,
  limit,
}: {
  tab: MatchCenterTab;
  date: string;
  tournament?: string;
  sport?: string;
  status: MatchCenterStatusFilter;
  view: MatchCenterView;
  page: number;
  limit: number;
}) {
  const offset = (page - 1) * limit;

  const { items, total, error, effectiveDateLabel } = await listPublicMatchesCenter({
    filters: {
      tab,
      date,
      tournament: tournament && tournament.trim() ? tournament : undefined,
      sport: sport && sport.trim() ? sport : undefined,
      status,
    },
    limit,
    offset,
  });

  if (error) {
    return <MatchErrorState message={error} />;
  }

  const showingCount = total != null ? offset + items.length : items.length;

  if (items.length === 0) {
    return <MatchEmptyState tab={tab} />;
  }

  const resultsContainerClass =
    view === "list"
      ? "space-y-4"
      : "grid gap-4 md:grid-cols-2";

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-semibold text-slate-50">
            Showing{" "}
            <span className="text-emerald-200">{showingCount}</span>{" "}
            matches
          </div>
          <div className="text-xs text-slate-400">
            Date: <span className="font-medium text-slate-300">{effectiveDateLabel}</span>
          </div>
        </div>
      </div>

      <div className={resultsContainerClass}>
        {items.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            variant={getStatusVariantForCard(tab, m)}
          />
        ))}
      </div>

      {items.length === limit ? (
        <div className="flex justify-center">
          <Link
            href={buildLoadMoreHref({
              tab,
              date,
              tournament: tournament && tournament.trim() ? tournament : undefined,
              sport,
              status,
              view,
              nextPage: page + 1,
            })}
            className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Load more
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function MatchesResultsSkeleton({ view }: { view: MatchCenterView }) {
  const count = 12;
  if (view === "list") {
    return (
      <section className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <MatchCardSkeleton key={i} view={view} />
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <MatchCardSkeleton key={i} view={view} />
      ))}
    </section>
  );
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsValue | undefined> | SearchParamsValue | undefined;
}) {
  const sp = searchParams ? await searchParams : undefined;

  const summary = await getMatchCenterSummary();

  const tabParam = parseTab(getString(sp, "tab"));
  const tab: MatchCenterTab =
    tabParam ?? (summary.liveCount > 0 ? "live" : "today");

  const dateParam = getString(sp, "date") ?? defaultDateForTab(tab);
  const tournament = getString(sp, "tournament");
  const sport = getString(sp, "sport") ?? "all";
  const status = parseStatusFilter(getString(sp, "status")) ?? defaultStatusForTab(tab);
  const view = parseView(getString(sp, "view"));

  const pageRaw = getString(sp, "page");
  const pageNum = pageRaw ? Math.max(1, Number(pageRaw)) : 1;
  const limit = 15;

  const tournamentOptions = await listMatchCenterTournamentOptions({ sport: sport ?? undefined, limit: 40 });

  return (
    <div className="space-y-4">
      {/* Header */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              Match Center
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Follow live, recent, and upcoming matches across Kulhivaru+.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              {summary.liveCount} Live
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              {summary.activeTournaments} Active tournaments
            </span>
          </div>
        </header>
      </section>

      <LiveSummaryStrip summary={summary} />

      {/* Tabs + filters */}
      <MatchCenterToolbar
        initial={{
          tab,
          date: dateParam,
          tournament,
          sport: sport ?? "all",
          status,
          view,
        }}
        tournamentOptions={tournamentOptions}
        initialShowCount={null}
      />

      {/* Results */}
      <Suspense fallback={<MatchesResultsSkeleton view={view} />}>
        <MatchesResults
          tab={tab}
          date={dateParam}
          tournament={tournament}
          sport={sport}
          status={status}
          view={view}
          page={pageNum}
          limit={limit}
        />
      </Suspense>
    </div>
  );
}

