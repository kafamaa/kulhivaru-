import Link from "next/link";

import { FixturesTabs } from "@/src/components/public/fixtures/fixtures-tabs";
import { FixturesFilterBar } from "@/src/components/public/fixtures/fixtures-filter-bar";
import { FixturesMatchCard } from "@/src/components/public/fixtures/fixtures-match-card";
import { FixturesEmptyState } from "@/src/components/public/fixtures/fixtures-empty-state";
import { FixturesErrorState } from "@/src/components/public/fixtures/fixtures-error-state";
import {
  listPublicTournamentFixtures,
  type TournamentFixturesTab,
  type TournamentFixturesFilters,
} from "@/src/features/matches/queries/list-public-tournament-fixtures";
import type { PublicTournamentFixtureItem } from "@/src/features/matches/queries/list-public-tournament-fixtures";
import { TournamentSubNav } from "@/src/features/tournaments/components/public/tournament-overview/tournament-sub-nav";

type SearchParamsValue = Record<string, string | string[] | undefined>;

function getString(sp: SearchParamsValue | undefined, key: string) {
  if (!sp) return undefined;
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function parseTab(input: string | undefined): TournamentFixturesTab {
  if (input === "all" || input === "live" || input === "results" || input === "upcoming") return input;
  if (input === undefined) return "auto";
  if (input === "auto") return "auto";
  return "auto";
}

function parsePage(input: string | undefined) {
  const n = Number(input ?? 1);
  if (Number.isNaN(n) || n < 1) return 1;
  return Math.floor(n);
}

function shouldDefaultPhaseGroupAll(phaseKey?: string) {
  return phaseKey === undefined || phaseKey === "all";
}

interface FixturesPageProps {
  params: Promise<{ slug: string }>;
  searchParams?:
    | Promise<SearchParamsValue | undefined>
    | SearchParamsValue
    | undefined;
}

export default async function TournamentFixturesPage({
  params,
  searchParams,
}: FixturesPageProps) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : undefined;

  const tabParam = parseTab(getString(sp, "tab"));
  const phaseParam = getString(sp, "phase");
  const groupParam = getString(sp, "group");
  const dateParam = getString(sp, "date");
  const page = parsePage(getString(sp, "page"));

  const filters: TournamentFixturesFilters = {
    phaseKey: shouldDefaultPhaseGroupAll(phaseParam) ? undefined : phaseParam,
    groupKey: shouldDefaultPhaseGroupAll(groupParam) ? undefined : groupParam,
    date: dateParam && dateParam !== "all" ? dateParam : undefined,
  };

  try {
    const data = await listPublicTournamentFixtures({
      slug,
      tab: tabParam,
      filters,
      page,
      limit: 12,
    });

    const canShow = data.items.length > 0;
    const hasMore = data.page * data.limit < data.total;

    // Group by phase -> group for this page slice.
    const phaseOrder = new Map<string, number>(
      data.phaseOptions
        .filter((p) => p.key !== "all")
        .map((p, idx) => [p.key, idx])
    );

    const phaseGroups = new Map<
      string,
      { phaseKey: string; phaseLabel: string; groups: Map<string, PublicTournamentFixtureItem[]> }
    >();

    for (const m of data.items) {
      if (!phaseGroups.has(m.phaseKey)) {
        phaseGroups.set(m.phaseKey, {
          phaseKey: m.phaseKey,
          phaseLabel: m.phaseLabel,
          groups: new Map(),
        });
      }
      const pg = phaseGroups.get(m.phaseKey)!;
      if (!pg.groups.has(m.groupKey)) pg.groups.set(m.groupKey, []);
      pg.groups.get(m.groupKey)!.push(m);
    }

    const orderedPhaseKeys = Array.from(phaseGroups.keys()).sort((a, b) => {
      const ia = phaseOrder.get(a);
      const ib = phaseOrder.get(b);
      if (ia == null && ib == null) return a.localeCompare(b);
      if (ia == null) return 1;
      if (ib == null) return -1;
      return ia - ib;
    });

    const loadMoreHref = (() => {
      const nextPage = data.page + 1;
      const params = new URLSearchParams();
      params.set("tab", tabParam === "auto" ? data.effectiveTab : tabParam);
      params.set("page", String(nextPage));

      if (filters.phaseKey) params.set("phase", filters.phaseKey);
      if (filters.groupKey) params.set("group", filters.groupKey);
      if (filters.date) params.set("date", filters.date);

      return `/t/${slug}/fixtures?${params.toString()}`;
    })();

    return (
      <div className="space-y-6">
        {/* 4. Tournament Header (compact) */}
        <section className="mx-auto max-w-7xl px-4 pt-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/t/${slug}`}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
                  >
                    ← Overview
                  </Link>
                  <span className="text-sm font-semibold text-slate-50 truncate">
                    {data.tournament.name}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {data.summary.totalMatches} Matches · {data.summary.playedMatches} Played ·{" "}
                  {data.summary.remainingMatches} Remaining
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold shadow-[0_0_0_1px_rgba(0,0,0,0.05)] ${
                    data.effectiveTab === "live"
                      ? "border-red-400/30 bg-red-500/10 text-red-100"
                      : data.tournament.status === "ongoing"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : data.tournament.status === "upcoming"
                          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                          : "border-white/10 bg-white/5 text-slate-300"
                  }`}
                >
                  {data.effectiveTab === "live"
                    ? "Live"
                    : data.tournament.status === "ongoing"
                      ? "Ongoing"
                      : data.tournament.status === "upcoming"
                        ? "Upcoming"
                        : "Completed"}
                </span>

                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200">
                  {data.effectiveTab === "results"
                    ? "Results"
                    : data.effectiveTab === "upcoming"
                      ? "Upcoming"
                      : data.effectiveTab === "live"
                        ? "Live feed"
                        : "All fixtures"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Tournament Sub-navigation */}
        <TournamentSubNav slug={slug} active="fixtures" />

        {/* 7. Tabs (Primary filter) */}
        <div className="px-0">
          <FixturesTabs activeTab={data.effectiveTab} />
        </div>

        {/* 6. Fixtures Header + Controls */}
        <section className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-50">Fixtures</h2>
              <p className="mt-1 text-sm text-slate-400">
                Explore live, upcoming, and completed matches for this tournament.
              </p>
            </div>

            <div className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-50 tabular-nums">{data.items.length}</span>{" "}
              of{" "}
              <span className="font-semibold text-slate-50 tabular-nums">{data.total}</span>{" "}
              matches
            </div>
          </div>
        </section>

        {/* 5. Sticky Filters Row */}
        <FixturesFilterBar
          slug={slug}
          activeTab={data.effectiveTab}
          phases={data.phaseOptions}
          groups={data.groupOptions}
          initial={{
            phaseKey: filters.phaseKey,
            groupKey: filters.groupKey,
            date: filters.date,
          }}
        />

        {/* 7. Matches List / Groups */}
        <section className="mx-auto max-w-7xl px-4 pb-10">
          {data.items.length === 0 ? (
            tabParam === "live" || data.effectiveTab === "live" ? (
              <FixturesEmptyState slug={slug} variant="no-live" />
            ) : (
              <FixturesEmptyState slug={slug} variant="no-matches" />
            )
          ) : (
            <div className="space-y-6">
              {orderedPhaseKeys.map((phaseKey) => {
                const pg = phaseGroups.get(phaseKey)!;
                const orderedGroupKeys = Array.from(pg.groups.keys()).sort((a, b) => {
                  if (a === "overall") return -1;
                  if (b === "overall") return 1;
                  return a.localeCompare(b);
                });

                return (
                  <div key={phaseKey} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-50">{pg.phaseLabel}</div>
                      <span className="text-[11px] font-semibold text-slate-300">
                        {pg.groups.size} groups
                      </span>
                    </div>

                    <div className="mt-4 space-y-4">
                      {orderedGroupKeys.map((groupKey) => {
                        const groupItems = pg.groups.get(groupKey) ?? [];
                        const groupLabel =
                          groupKey === "overall" ? "Overall" : groupItems[0]?.groupLabel ?? "Group";

                        return (
                          <div key={groupKey}>
                            <div className="mb-3 flex items-center justify-between">
                              <div className="text-xs font-semibold text-slate-300">
                                {groupLabel}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {groupItems.length} match{groupItems.length !== 1 ? "es" : ""}
                              </div>
                            </div>

                            <div className="space-y-3">
                              {groupItems.map((m) => (
                                <FixturesMatchCard key={m.id} match={m} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 8. Pagination / Load more */}
          {data.items.length > 0 ? (
            <div className="mt-8 flex justify-center">
              {hasMore ? (
                <Link
                  href={loadMoreHref}
                  className="inline-flex items-center rounded-2xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
                >
                  Load more →
                </Link>
              ) : (
                <div className="text-xs text-slate-400">
                  You&apos;ve reached the end of this list.
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return (
      <div className="mx-auto max-w-5xl px-4 pt-10 pb-20">
        <FixturesErrorState message={message} />
      </div>
    );
  }
}

