import Link from "next/link";
import { notFound } from "next/navigation";
import { FeaturedMatchCard } from "@/src/features/tournaments/components/public/tournament-overview/featured-match-card";
import { TournamentSummaryCards } from "@/src/features/tournaments/components/public/tournament-overview/tournament-summary-cards";
import { TournamentCompetitionBand } from "@/src/features/tournaments/components/public/tournament-overview/tournament-competition-band";
import { TournamentTeamsPreviewSection } from "@/src/features/tournaments/components/public/tournament-overview/tournament-teams-preview-section";
import { FixturesMatchCard } from "@/src/components/public/fixtures/fixtures-match-card";
import { getPublicTournamentOverviewData } from "@/src/features/tournaments/queries/get-public-tournament-overview-data";
import {
  listPublicTournamentFixtures,
  type PublicTournamentFixtureItem,
} from "@/src/features/matches/queries/list-public-tournament-fixtures";

type SearchParamsValue = Record<string, string | string[] | undefined>;

function getString(sp: SearchParamsValue | undefined, key: string) {
  if (!sp) return undefined;
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function norm(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function filterFixturesForCategory(
  items: PublicTournamentFixtureItem[],
  categoryId: string,
  categoryLabel: string
) {
  if (categoryId === "overall") return items;
  const byKey = items.filter((x) => norm(x.groupKey) === norm(categoryId));
  if (byKey.length > 0) return byKey;
  const byLabel = items.filter((x) => norm(x.groupLabel) === norm(categoryLabel));
  if (byLabel.length > 0) return byLabel;
  return items;
}

function groupFixturesByPhase(items: PublicTournamentFixtureItem[]) {
  const map = new Map<string, { phaseKey: string; phaseLabel: string; items: PublicTournamentFixtureItem[] }>();
  for (const m of items) {
    const key = `${m.phaseKey}::${m.phaseLabel}`;
    const bucket = map.get(key);
    if (bucket) bucket.items.push(m);
    else map.set(key, { phaseKey: m.phaseKey, phaseLabel: m.phaseLabel, items: [m] });
  }
  const phaseOrder = ["group-stage", "quarter-finals", "semi-finals", "final", "custom", "unknown"];
  return Array.from(map.values()).sort(
    (a, b) => phaseOrder.indexOf(a.phaseKey) - phaseOrder.indexOf(b.phaseKey)
  );
}

interface CategoryDetailPageProps {
  params: Promise<{ slug: string; categoryId: string }>;
  searchParams?: Promise<SearchParamsValue | undefined> | SearchParamsValue | undefined;
}

const TAB_IDS = ["overview", "matches", "standings", "bracket", "teams"] as const;
type TabId = (typeof TAB_IDS)[number];

export default async function TournamentCategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps) {
  const { slug, categoryId } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const tab = (getString(sp, "tab") ?? "overview") as TabId;
  const activeTab: TabId = TAB_IDS.includes(tab) ? tab : "overview";

  const selectedGroupId = categoryId === "overall" ? null : categoryId;
  const data = await getPublicTournamentOverviewData({ slug, selectedGroupId });

  const category = data.groups.find(
    (g) => (g.groupId ?? "overall") === (selectedGroupId ?? "overall")
  );
  if (!category) return notFound();

  const fixturesData = await listPublicTournamentFixtures({
    slug,
    tab: "all",
    filters: {},
    page: 1,
    limit: 200,
  });

  const filteredFixtures = filterFixturesForCategory(
    fixturesData.items,
    categoryId,
    category.label
  );
  const live = filteredFixtures.filter((m) => m.status === "live");
  const scheduled = filteredFixtures.filter((m) => m.status === "scheduled");
  const completed = filteredFixtures.filter((m) => m.status === "ft" || m.status === "completed");
  const matchFeed = [...live, ...scheduled, ...completed];
  const groupedByPhase = groupFixturesByPhase(matchFeed);
  const hasKnockout = filteredFixtures.some((m) =>
    ["quarter-finals", "semi-finals", "final"].includes(m.phaseKey)
  );

  const categoryStatus =
    data.tournament.status === "completed"
      ? "Completed"
      : data.tournament.status === "ongoing"
        ? "Ongoing"
        : "Registration";

  return (
    <div className="space-y-6 pb-10">
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Category
              </div>
              <h1 className="mt-1 text-2xl font-semibold text-slate-50">{category.label}</h1>
              <p className="mt-1 text-sm text-slate-400">{data.tournament.name}</p>
              <p className="mt-2 text-xs text-slate-400">
                Format: Group stage + knockout (auto-derived from fixtures/phases)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                {categoryStatus}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                Teams {category.teamsCount}
              </span>
              <Link
                href={hasKnockout ? `?tab=bracket` : `?tab=matches`}
                className="rounded-2xl border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100"
              >
                {hasKnockout ? "View Bracket" : "View Matches"} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TournamentSummaryCards
        slug={slug}
        summary={{
          teamsCount: category.teamsCount,
          matchesCount: filteredFixtures.length,
          categoriesCount: data.summary.categoriesCount,
          currentPhaseLabel: data.summary.currentPhaseLabel,
        }}
        sponsors={data.sponsorsPreview}
      />

      <section className="mx-auto max-w-7xl px-4">
        <div className="sticky top-14 z-20 rounded-3xl border border-white/15 bg-white/[0.07] p-2.5 backdrop-blur-xl">
          <div className="flex gap-2 overflow-x-auto">
            {TAB_IDS.map((id) => {
              const href = `/t/${slug}/c/${categoryId}?tab=${id}`;
              const active = activeTab === id;
              return (
                <Link
                  key={id}
                  href={href}
                  className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                    active
                      ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100"
                      : "border-white/15 bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"
                  }`}
                >
                  {id[0]!.toUpperCase() + id.slice(1)}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <section className="mx-auto max-w-7xl px-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-semibold text-slate-50">About Category</h2>
                <p className="mt-2 text-sm text-slate-300">
                  This category follows the tournament fixture flow with group/phase context and
                  auto-updated standings.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-semibold text-slate-50">Phase Timeline</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Registration → Group Stage → Knockout → Finals
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4">
            {data.featuredMatch ? (
              <FeaturedMatchCard match={data.featuredMatch} />
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                No highlight match available yet.
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "matches" && (
        <section className="mx-auto max-w-7xl px-4">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-50">Matches</h2>
              <p className="mt-1 text-sm text-slate-400">
                Live fixtures are pinned first, grouped by phase for quick scanning.
              </p>
            </div>
            <Link
              href={`/t/${slug}/fixtures`}
              className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
            >
              Open full fixtures →
            </Link>
          </div>

          {groupedByPhase.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
              No matches available for this category yet.
            </div>
          ) : (
            <div className="space-y-5">
              {groupedByPhase.map((phase) => (
                <div key={phase.phaseKey} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-100">{phase.phaseLabel}</h3>
                    <span className="text-xs text-slate-400">{phase.items.length} matches</span>
                  </div>
                  <div className="space-y-3">
                    {phase.items.map((m) => (
                      <FixturesMatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "standings" && (
        <TournamentCompetitionBand
          slug={slug}
          groupLabel={category.label}
          groups={data.groups}
          selectedGroupId={data.selectedGroupId}
          standingsPreview={data.standingsPreview}
          topScorers={data.topScorers}
          topAssists={data.topAssists}
        />
      )}

      {activeTab === "bracket" && (
        <section className="mx-auto max-w-7xl px-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-slate-50">Bracket</h2>
            <p className="mt-2 text-sm text-slate-400">
              Bracket visualization will render from knockout fixtures for this category.
            </p>
            {!hasKnockout ? (
              <p className="mt-3 text-xs text-slate-500">
                No knockout rounds detected yet in this category.
              </p>
            ) : null}
          </div>
        </section>
      )}

      {activeTab === "teams" && (
        <TournamentTeamsPreviewSection
          slug={slug}
          teamsPreview={data.teamsPreview}
          groupLabel={category.label}
        />
      )}
    </div>
  );
}
