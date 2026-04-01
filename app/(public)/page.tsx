import Link from "next/link";
import { listPublicTournaments } from "@/src/features/tournaments/queries/list-public-tournaments";
import { listLiveMatchesPreview } from "@/src/features/matches/queries/list-live-matches-preview";
import { getPlatformStats } from "@/src/features/stats/queries/get-platform-stats";
import { getTopScorersPreview } from "@/src/features/stats/queries/get-top-scorers-preview";
import { getStandingsPreview } from "@/src/features/standings/queries/get-standings-preview";
import { getFeaturedPlayer } from "@/src/features/players/queries/get-featured-player";
import { getFeaturedTeam } from "@/src/features/teams/queries/get-featured-team";
import {
  getLiveStreamPreview,
  getHighlightsPreview,
} from "@/src/features/media/queries/get-watch-preview";
import { Hero } from "@/src/components/public/hero";
import { GlobalSearchBar } from "@/src/components/public/global-search-bar";
import { LiveMatchesSection } from "@/src/components/public/live-matches-section";
import { TodaysMatchesSection } from "@/src/components/public/todays-matches-section";
import { OngoingTournamentsSection } from "@/src/components/public/ongoing-tournaments-section";
import { UpcomingTournamentsSection } from "@/src/components/public/upcoming-tournaments-section";
import { StatsPreviewSection } from "@/src/components/public/stats-preview-section";
import { FeaturedPlayerTeam } from "@/src/components/public/featured-player-team";
import { WatchSection } from "@/src/components/public/watch-section";
import { OrganizerCtaSection } from "@/src/components/public/organizer-cta-section";
import { TrustStatsSection } from "@/src/components/public/trust-stats-section";

// Load all homepage data in parallel (server).
async function HomePageData() {
  const [
    ongoing,
    upcoming,
    liveMatches,
    platformStats,
    topScorers,
    standingsPreview,
    featuredPlayer,
    featuredTeam,
    liveStream,
    highlights,
  ] = await Promise.all([
    listPublicTournaments({ status: "ongoing", limit: 6 }),
    listPublicTournaments({ status: "upcoming", limit: 6 }),
    listLiveMatchesPreview(),
    getPlatformStats(),
    getTopScorersPreview(5),
    getStandingsPreview(5),
    getFeaturedPlayer(),
    getFeaturedTeam(),
    getLiveStreamPreview(),
    getHighlightsPreview(6),
  ]);

  return {
    ongoing,
    upcoming,
    liveMatches,
    platformStats,
    topScorers: topScorers.map((p) => ({
      id: p.id,
      name: p.name,
      teamName: p.teamName,
      goals: p.goals,
      imageUrl: p.imageUrl ?? null,
    })),
    standingsPreview: standingsPreview.map((s) => ({
      rank: s.rank,
      teamName: s.teamName,
      teamId: s.teamId,
      points: s.points,
      played: s.played,
      logoUrl: s.logoUrl ?? null,
    })),
    featuredPlayer: featuredPlayer
      ? {
          id: featuredPlayer.id,
          name: featuredPlayer.name,
          teamName: featuredPlayer.teamName ?? "Unknown",
          teamId: featuredPlayer.teamId ?? undefined,
          imageUrl: featuredPlayer.imageUrl,
          position: featuredPlayer.position ?? undefined,
          goals: featuredPlayer.goals,
          assists: featuredPlayer.assists,
        }
      : null,
    featuredTeam: featuredTeam
      ? {
          id: featuredTeam.id,
          name: featuredTeam.name,
          logoUrl: featuredTeam.logoUrl,
          tournamentName: featuredTeam.tournamentName ?? undefined,
          points: featuredTeam.points,
        }
      : null,
    liveStream: liveStream
      ? {
          id: liveStream.id,
          title: liveStream.title,
          tournamentName: liveStream.tournamentName ?? "Kulhivaru+",
          tournamentSlug: liveStream.tournamentSlug ?? undefined,
          isLive: liveStream.isLive,
          thumbnailUrl: liveStream.thumbnailUrl,
          startAt: liveStream.startAt,
        }
      : null,
    highlights: highlights.map((h) => ({
      id: h.id,
      title: h.title,
      thumbnailUrl: h.thumbnailUrl,
      duration: h.duration ?? undefined,
      tournamentName: h.tournamentName ?? undefined,
    })),
    heroTournamentPhotos: [...ongoing, ...upcoming]
      .map((t) => ({
        id: t.id,
        name: t.name,
        imageUrl: t.coverImageUrl ?? t.logoUrl ?? null,
        href: `/t/${t.slug}`,
      }))
      .filter((t): t is { id: string; name: string; imageUrl: string; href: string } => Boolean(t.imageUrl))
      .slice(0, 10),
  };
}

// Fetches data and renders sections. Errors are caught and show a retry state.
export default async function PublicHomePage() {
  let data: Awaited<ReturnType<typeof HomePageData>>;
  try {
    data = await HomePageData();
  } catch (e) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-slate-400">Something went wrong loading the page.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-emerald-300 hover:text-emerald-200">
          Try again
        </Link>
      </div>
    );
  }

  const {
    ongoing,
    upcoming,
    liveMatches,
    platformStats,
    topScorers,
    standingsPreview,
    featuredPlayer,
    featuredTeam,
    liveStream,
    highlights,
    heroTournamentPhotos,
  } = data;

  return (
    <>
      {/* 1. Hero */}
      <Hero
        liveMatchPreview={liveMatches[0] ?? null}
        standingsPreview={standingsPreview}
        topScorersPreview={topScorers}
        tournamentPhotos={heroTournamentPhotos}
        featuredPlayer={featuredPlayer}
        featuredTeam={featuredTeam}
      />

      {/* 2. Global search bar */}
      <GlobalSearchBar />

      {/* 3. Live matches */}
      <LiveMatchesSection matches={liveMatches} />

      {/* 4. Today's matches */}
      <TodaysMatchesSection matches={liveMatches} />

      {/* 5. Ongoing tournaments */}
      <OngoingTournamentsSection tournaments={ongoing} />

      {/* 6. Upcoming tournaments */}
      <UpcomingTournamentsSection tournaments={upcoming} />

      {/* 7. Quick stats preview */}
      <StatsPreviewSection
        topScorers={topScorers}
        standingsPreview={standingsPreview}
      />

      {/* 8. Featured player / team */}
      <FeaturedPlayerTeam player={featuredPlayer} team={featuredTeam} />

      {/* 9. Watch / highlights preview */}
      <WatchSection liveStream={liveStream} highlights={highlights} />

      {/* 10. Organizer CTA section */}
      <OrganizerCtaSection />

      {/* 11. Trust / platform stats */}
      <TrustStatsSection stats={platformStats} />
    </>
  );
}
