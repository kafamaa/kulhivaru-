import Link from "next/link";

import { TournamentSubNav } from "@/src/features/tournaments/components/public/tournament-overview/tournament-sub-nav";
import {
  getPublicTournamentTeamsDirectory,
  type TournamentTeamsSort,
  type TournamentTeamsStatusFilter,
} from "@/src/features/teams/queries/get-public-tournament-teams-directory";
import { TeamsFilterBar } from "@/src/features/teams/components/public/teams-filter-bar";
import { TournamentTeamCard } from "@/src/features/teams/components/public/tournament-team-card";

interface TournamentTeamsPageProps {
  params: Promise<{ slug: string }>;
  searchParams?:
    | Promise<Record<string, string | string[] | undefined> | undefined>
    | Record<string, string | string[] | undefined>
    | undefined;
}

function getString(
  sp: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  if (!sp) return undefined;
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function parsePage(input: string | undefined) {
  const n = Number(input ?? 1);
  if (Number.isNaN(n) || n < 1) return 1;
  return Math.floor(n);
}

function parseSort(input: string | undefined): TournamentTeamsSort {
  if (input === "rank" || input === "points" || input === "played") return input;
  return "rank";
}

function parseStatus(input: string | undefined): TournamentTeamsStatusFilter {
  if (input === "all" || input === "leading" || input === "qualified" || input === "eliminated" || input === "active") return input;
  return "all";
}

export default async function TournamentTeamsPage({
  params,
  searchParams,
}: TournamentTeamsPageProps) {
  const { slug } = await params;

  const sp = searchParams ? await searchParams : undefined;
  const q = getString(sp, "q") ?? null;
  const groupKey = getString(sp, "group") ?? "overall";
  const status = parseStatus(getString(sp, "status"));
  const sort = parseSort(getString(sp, "sort"));
  const page = parsePage(getString(sp, "page"));

  const data = await getPublicTournamentTeamsDirectory({
    slug,
    page,
    limit: 12,
    q,
    groupKey,
    status,
    sort,
  });

  const hasMore = data.page * data.limit < data.total;

  const loadMoreHref = (() => {
    const nextPage = data.page + 1;
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (groupKey && groupKey !== "overall") params.set("group", groupKey);
    if (status !== "all") params.set("status", status);
    if (sort !== "rank") params.set("sort", sort);
    params.set("page", String(nextPage));
    return `/t/${slug}/teams?${params.toString()}`;
  })();

  const statusBadge = (() => {
    const s = data.tournament.status;
    if (s === "ongoing") return { label: "Ongoing", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" };
    if (s === "upcoming") return { label: "Upcoming", cls: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200" };
    if (s === "completed") return { label: "Completed", cls: "border-white/10 bg-white/5 text-slate-300" };
    return { label: "Live", cls: "border-red-400/30 bg-red-500/10 text-red-100" };
  })();

  return (
    <div className="space-y-6">
      {/* 4. Tournament Header (compact) */}
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
                  Teams · {data.tournament.name}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-200">
                  {data.summary.totalTeams} Teams
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-200">
                  {Math.max(0, data.groups.length - 1)} Groups
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-200">
                  {data.summary.rankedTeams} Ranked
                </span>
              </div>
            </div>

            <span
              className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold shadow-[0_0_0_1px_rgba(0,0,0,0.05)] ${statusBadge.cls}`}
            >
              {statusBadge.label}
            </span>
          </div>
        </div>
      </section>

      {/* 5. Tournament Sub-navigation */}
      <TournamentSubNav slug={slug} active="teams" />

      {/* 7. Filter Toolbar */}
      <TeamsFilterBar
        slug={slug}
        groups={data.groups}
        initial={{
          q,
          groupKey,
          status,
          sort,
        }}
      />

      {/* 10. Spotlight teams row (optional) */}
      {data.spotlight.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4">
          <div className="grid gap-3 md:grid-cols-2">
            {data.spotlight.map((s, idx) => (
              <div
                key={s.teamId}
                className={`rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.18)] ${
                  idx === 0 ? "border-emerald-400/30" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      {s.teamLogoUrl ? (
                        <img
                          src={s.teamLogoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-300">
                          {s.teamName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-50">
                        {s.teamName}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{s.reason}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-200 tabular-nums">
                      {s.points} pts
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-slate-400">
                      Core stat
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Link
                    href={`/team/${s.teamId}`}
                    className="inline-flex items-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
                  >
                    View Team →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 6. Teams Header + Summary */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-50">Teams</h2>
            <p className="mt-1 text-sm text-slate-400">
              Browse all teams competing in this tournament.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-50 tabular-nums">
              {data.teams.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-50 tabular-nums">
              {data.total}
            </span>
          </div>
        </div>

        {data.teams.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <span className="text-xl">★</span>
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-50">No teams found</h3>
            <p className="mt-2 text-sm text-slate-400">
              Try changing your group, status, or search filters.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href={`/t/${slug}/teams`}
                className="inline-flex items-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30 px-6 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25"
              >
                Clear Filters →
              </Link>
              <Link
                href={`/t/${slug}/teams?status=all`}
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                View All Teams
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.teams.map((t) => (
              <TournamentTeamCard key={t.teamId} row={t} />
            ))}
          </div>
        )}

        {/* 8. Pagination / Load More */}
        {data.teams.length > 0 && hasMore ? (
          <div className="mt-10 flex justify-center">
            <Link
              href={loadMoreHref}
              className="inline-flex items-center rounded-2xl bg-white/5 border border-white/10 px-8 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Load more →
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}

