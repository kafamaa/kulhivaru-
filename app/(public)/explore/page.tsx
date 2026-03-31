import { Suspense } from "react";
import { explorePublicTournaments, type ExploreSort, type ExploreStatusFilter, type ExploreView } from "@/src/features/tournaments/queries/explore-public-tournaments";
import { ExploreFilterToolbar } from "@/src/components/public/explore/explore-filter-toolbar";
import { ActiveFilterChips } from "@/src/components/public/explore/active-filter-chips";
import { TournamentCard } from "@/src/components/public/explore/tournament-card";
import { TournamentCardSkeleton } from "@/src/components/public/explore/tournament-card-skeleton";
import { EmptyStatePanel } from "@/src/components/public/explore/empty-state-panel";
import { ErrorStatePanel } from "@/src/components/public/explore/error-state-panel";

type SearchParamsValue = Record<string, string | string[] | undefined>;

function getString(
  sp: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const v = sp?.[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function parseExploreSearchParams(
  sp: Record<string, string | string[] | undefined> | undefined
) {
  const q = getString(sp, "q");
  const statusRaw = getString(sp, "status");
  const sport = getString(sp, "sport") ?? "all";
  const location = getString(sp, "location");
  const organizer = getString(sp, "organizer");
  const sortRaw = getString(sp, "sort");
  const viewRaw = getString(sp, "view");

  const status: ExploreStatusFilter =
    statusRaw === "ongoing" ||
    statusRaw === "upcoming" ||
    statusRaw === "completed" ||
    statusRaw === "live"
      ? statusRaw
      : "all";

  const sort: ExploreSort =
    sortRaw === "relevant" ||
    sortRaw === "newest" ||
    sortRaw === "startingSoon" ||
    sortRaw === "updated" ||
    sortRaw === "popular"
      ? sortRaw
      : "relevant";

  const view: ExploreView =
    viewRaw === "list" || viewRaw === "grid" ? viewRaw : "grid";

  const pageRaw = getString(sp, "page");
  const pageNum = pageRaw ? Math.max(1, Number(pageRaw)) : 1;

  return {
    q,
    status,
    sport,
    location,
    organizer,
    sort,
    view,
    page: Number.isFinite(pageNum) ? pageNum : 1,
  };
}

async function ExploreResults({
  filters,
  page,
  limit,
}: {
  filters: {
    q?: string;
    status: ExploreStatusFilter;
    sport: string;
    location?: string;
    organizer?: string;
    sort: ExploreSort;
    view: ExploreView;
  };
  page: number;
  limit: number;
}) {
  const offset = (page - 1) * limit;

  const { items, total, error } = await explorePublicTournaments({
    filters: {
      q: filters.q,
      status: filters.status,
      sport: filters.sport,
      location: filters.location,
      organizer: filters.organizer,
    },
    sort: filters.sort,
    limit,
    offset,
    view: filters.view,
  });

  if (error) {
    return (
      <ErrorStatePanel message={error} />
    );
  }

  const showingCount = total != null ? offset + items.length : items.length;

  const resultsContainerClass =
    filters.view === "list"
      ? "space-y-3"
      : "grid gap-4 md:grid-cols-3";

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-50">
              Showing{" "}
              <span className="text-emerald-200">{showingCount}</span>{" "}
              tournaments
            </div>
            {total != null ? (
              <div className="mt-1 text-xs text-slate-400">
                Total: {total}
              </div>
            ) : null}
          </div>
          <ActiveFilterChips
            filters={{
              q: filters.q,
              status: filters.status,
              sport: filters.sport,
              location: filters.location,
              organizer: filters.organizer,
              sort: filters.sort,
            }}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyStatePanel />
      ) : (
        <div className={resultsContainerClass}>
          {items.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              variant={filters.view}
            />
          ))}
        </div>
      )}

      {items.length > 0 && items.length === limit ? (
        <div className="flex justify-center">
          <a
            href={(() => {
              const params = new URLSearchParams();
              if (filters.q?.trim()) params.set("q", filters.q.trim());
              if (filters.status !== "all") params.set("status", filters.status);
              if (filters.sport && filters.sport !== "all")
                params.set("sport", filters.sport);
              if (filters.location?.trim())
                params.set("location", filters.location.trim());
              if (filters.organizer?.trim())
                params.set("organizer", filters.organizer.trim());
              params.set("sort", filters.sort);
              params.set("view", filters.view);
              params.set("page", String(page + 1));
              return `/explore?${params.toString()}`;
            })()}
            className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Load more
          </a>
        </div>
      ) : null}
    </section>
  );
}

function ExploreResultsSkeleton({ view }: { view: ExploreView }) {
  const skeletons = Array.from({ length: 12 });
  if (view === "list") {
    return (
      <section className="space-y-3">
        {skeletons.map((_, i) => (
          <TournamentCardSkeleton key={i} variant="list" />
        ))}
      </section>
    );
  }
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {skeletons.slice(0, 9).map((_, i) => (
        <TournamentCardSkeleton key={i} variant="grid" />
      ))}
    </section>
  );
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsValue | undefined> | SearchParamsValue | undefined;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const parsed = parseExploreSearchParams(sp);
  const limit = 12;

  return (
    <div className="space-y-6">
      {/* Explore header */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              Explore Tournaments
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Browse ongoing, upcoming, and completed competitions across
              teams, categories, and organizers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              Fast filtering
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              URL-synced state
            </span>
          </div>
        </header>
      </section>

      {/* Toolbar (sticky) */}
      <ExploreFilterToolbar
        initial={{
          q: parsed.q,
          status: parsed.status,
          sport: parsed.sport,
          location: parsed.location,
          organizer: parsed.organizer,
          sort: parsed.sort,
          view: parsed.view,
        }}
      />

      <Suspense
        fallback={<ExploreResultsSkeleton view={parsed.view} />}
      >
        <ExploreResults
          filters={{
            q: parsed.q,
            status: parsed.status,
            sport: parsed.sport,
            location: parsed.location,
            organizer: parsed.organizer,
            sort: parsed.sort,
            view: parsed.view,
          }}
          page={parsed.page}
          limit={limit}
        />
      </Suspense>
    </div>
  );
}

