import Link from "next/link";
import { FeaturedMatchCard } from "@/src/features/tournaments/components/public/tournament-overview/featured-match-card";
import { TournamentSubNav } from "@/src/features/tournaments/components/public/tournament-overview/tournament-sub-nav";
import { TournamentHero } from "@/src/features/tournaments/components/public/tournament-overview/tournament-hero";
import { TournamentSummaryCards } from "@/src/features/tournaments/components/public/tournament-overview/tournament-summary-cards";
import { TournamentMatchCenterBand } from "@/src/features/tournaments/components/public/tournament-overview/tournament-match-center-band";
import { TournamentCompetitionBand } from "@/src/features/tournaments/components/public/tournament-overview/tournament-competition-band";
import { TournamentTeamsPreviewSection } from "@/src/features/tournaments/components/public/tournament-overview/tournament-teams-preview-section";
import { TournamentMediaPreviewSection } from "@/src/features/tournaments/components/public/tournament-overview/tournament-media-preview-section";
import { TournamentSponsorsSection } from "@/src/features/tournaments/components/public/tournament-overview/tournament-sponsors-section";
import { getPublicTournamentOverviewData } from "@/src/features/tournaments/queries/get-public-tournament-overview-data";

type SearchParamsValue = Record<string, string | string[] | undefined>;

function getString(sp: SearchParamsValue | undefined, key: string) {
  if (!sp) return undefined;
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

interface TournamentOverviewPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<SearchParamsValue | undefined> | SearchParamsValue | undefined;
}

export default async function TournamentOverviewPage({
  params,
  searchParams,
}: TournamentOverviewPageProps) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const groupParam = getString(sp, "group");
  const selectedGroupId =
    groupParam === undefined
      ? undefined
      : groupParam === "overall"
        ? null
        : groupParam ?? undefined;

  const data = await getPublicTournamentOverviewData({
    slug,
    selectedGroupId,
  });

  const effectiveStatus = data.featuredMatch?.status === "live" ? "live" : data.tournament.status;
  const statusLabel =
    effectiveStatus === "live"
      ? "Live"
      : effectiveStatus === "ongoing"
        ? "Ongoing"
        : effectiveStatus === "upcoming"
          ? "Upcoming"
          : "Completed";

  const primaryCta =
    effectiveStatus === "upcoming"
      ? { href: `/t/${slug}/teams`, label: "Register Now" }
      : effectiveStatus === "completed"
        ? { href: `/t/${slug}/standings`, label: "See Results" }
        : { href: `/t/${slug}/fixtures`, label: "View Matches" };

  const groupLabel =
    data.groups.find((g) => g.groupId === data.selectedGroupId)?.label ?? "Overall";

  return (
    <div className="space-y-8 pb-10">
      <TournamentHero
        slug={slug}
        tournament={data.tournament}
        groups={data.groups}
        selectedGroupId={data.selectedGroupId}
        effectiveStatus={effectiveStatus as "live" | "ongoing" | "upcoming" | "completed"}
        statusLabel={statusLabel}
        primaryCta={primaryCta}
        groupLabel={groupLabel}
      />

      <TournamentSummaryCards
        slug={slug}
        summary={data.summary}
        sponsors={data.sponsorsPreview}
      />

      <section className="mx-auto max-w-7xl px-4">
        {data.featuredMatch ? (
          <FeaturedMatchCard match={data.featuredMatch} />
        ) : (
          <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-8 text-center backdrop-blur-xl shadow-[0_18px_70px_rgba(0,0,0,0.3)]">
            <div className="text-lg font-semibold text-slate-50">No matches yet</div>
            <p className="mt-2 text-sm text-slate-400">
              Fixtures will appear once scheduling is configured.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href={`/t/${slug}/fixtures`}
                className="inline-flex items-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-6 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25"
              >
                Open Fixtures →
              </Link>
            </div>
          </div>
        )}
      </section>

      <TournamentSubNav slug={slug} active="overview" />

      <TournamentMatchCenterBand
        slug={slug}
        upcomingMatches={data.upcomingMatches}
        recentResults={data.recentResults}
      />

      <TournamentCompetitionBand
        slug={slug}
        groupLabel={groupLabel}
        groups={data.groups}
        selectedGroupId={data.selectedGroupId}
        standingsPreview={data.standingsPreview}
        topScorers={data.topScorers}
        topAssists={data.topAssists}
      />

      <TournamentTeamsPreviewSection
        slug={slug}
        teamsPreview={data.teamsPreview}
        groupLabel={groupLabel}
      />

      <TournamentMediaPreviewSection slug={slug} mediaPreview={data.mediaPreview} />

      <TournamentSponsorsSection sponsors={data.sponsorsPreview} />
    </div>
  );
}
