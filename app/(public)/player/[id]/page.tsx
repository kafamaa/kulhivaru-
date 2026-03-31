import Link from "next/link";

import { PublicPlayerProfileLayout } from "@/src/components/public/player-detail/public-player-profile-layout";
import { getPublicPlayerPerformance } from "@/src/features/players/queries/get-public-player-performance";
import { getPublicPlayerProfile } from "@/src/features/players/queries/get-public-player-profile";
import { getPublicPlayerRankings } from "@/src/features/players/queries/get-public-player-rankings";
import { getPublicPlayerRecentMatches } from "@/src/features/players/queries/get-public-player-recent-matches";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const profile = await getPublicPlayerProfile(id);

    if (!profile) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
            <h2 className="text-2xl font-semibold text-slate-50">Player not found</h2>
            <p className="mt-2 text-sm text-slate-400">
              This player may have been removed or the ID is incorrect.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/explore?type=players"
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                Browse Players
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const [performance, rankings] = await Promise.all([
      getPublicPlayerPerformance({ playerId: id }),
      getPublicPlayerRankings({ playerId: id }),
    ]);

    const playerTeamId = profile.team?.teamId ?? null;
    const recentMatches = playerTeamId
      ? await getPublicPlayerRecentMatches({
          playerId: id,
          playerTeamId,
        })
      : [];

    const primaryTournament = profile.tournaments[0] ?? null;
    const primaryTournamentSlug = primaryTournament?.tournamentSlug ?? null;

    return (
      <PublicPlayerProfileLayout
        profile={profile}
        performance={performance}
        rankings={rankings}
        recentMatches={recentMatches}
        primaryTournament={primaryTournament}
        primaryTournamentSlug={primaryTournamentSlug}
      />
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";

    return (
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-12">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-400/20 bg-red-500/10 p-10 text-center backdrop-blur-md">
          <h3 className="text-2xl font-semibold text-red-100">Couldn&apos;t load player data</h3>
          <p className="mt-2 text-sm text-red-200/90">{message}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link
              href={`/player/${id}`}
              className="inline-flex items-center rounded-2xl border border-red-400/30 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25"
            >
              Retry
            </Link>
            <Link
              href="/explore?type=players"
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Browse Players
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
