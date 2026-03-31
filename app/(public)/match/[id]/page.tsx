import Link from "next/link";
import { getPublicMatchDetail } from "@/src/features/matches/public/queries/get-public-match-detail";
import { getPublicMatchEvents } from "@/src/features/matches/public/queries/get-public-match-events";
import { listPublicLiveStreams } from "@/src/features/media/queries/list-public-watch-media";

import { MatchHeaderScoreboard } from "@/src/components/public/match-detail/match-header-scoreboard";
import { MatchInfoBar } from "@/src/components/public/match-detail/match-info-bar";
import { MatchLiveStream, type PublicMatchLiveStream } from "@/src/components/public/match-detail/match-live-stream";
import { MatchTimeline } from "@/src/components/public/match-detail/match-timeline";
import { LiveMatchRefresher } from "@/src/components/public/match-detail/live-match-refresh";
import { MatchStatsPanel } from "@/src/components/public/match-detail/match-stats-panel";
import { MatchLineupsPanel } from "@/src/components/public/match-detail/match-lineups-panel";

import { deriveMatchStats } from "@/src/features/matches/public/lib/derive-match-stats";
import { deriveMatchLineups } from "@/src/features/matches/public/lib/derive-match-lineups";

interface PublicMatchDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicMatchDetailPage({
  params,
}: PublicMatchDetailPageProps) {
  const { id } = await params;
  try {
    const match = await getPublicMatchDetail({ matchId: id });

    if (!match) {
      return (
        <div className="space-y-4 mx-auto max-w-3xl px-4 py-12">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
            <h2 className="text-2xl font-semibold text-slate-50">
              Match not found
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              This match may have been removed, or the ID is incorrect.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/matches"
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                Back to Matches
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const events = await getPublicMatchEvents({ matchId: id });
    const derivedStats = deriveMatchStats({ match, events });
    const derivedLineups = deriveMatchLineups({ match, events });

    let firstStream: PublicMatchLiveStream | null = null;
    if (match.status === "live") {
      if (!match.tournamentSlug) {
        firstStream = null;
      } else {
        const items = await listPublicLiveStreams({
          tournamentSlug: match.tournamentSlug || null,
          limit: 1,
        });
        const s = items[0];
        if (s) {
          firstStream = {
            id: String(s.id),
            title: String(s.title ?? "Live stream"),
            thumbnailUrl: (s.thumbnailUrl as string | null) ?? null,
            duration: (s.duration as string | null) ?? null,
            startAt: (s.startAt as string | null) ?? null,
            tournamentSlug:
              (s.tournamentSlug as string | null) ?? null,
          } satisfies PublicMatchLiveStream;
        }
      }
    }

    return (
      <div className="space-y-6">
        <MatchHeaderScoreboard match={match} />
        <MatchInfoBar match={match} />
        <LiveMatchRefresher matchStatus={match.status} />

        {match.status === "live" && firstStream ? (
          <div className="fixed bottom-4 left-0 right-0 z-50 px-4 md:hidden">
            <Link
              href={`/watch/${firstStream.id}`}
              className="mx-auto flex w-full items-center justify-center rounded-2xl bg-red-500/20 border border-red-400/35 px-4 py-4 text-sm font-semibold text-red-100 shadow-[0_20px_70px_rgba(239,68,68,0.28)] hover:bg-red-500/25"
            >
              Watch Live →
            </Link>
          </div>
        ) : null}

        {firstStream ? (
          <MatchLiveStream stream={firstStream} />
        ) : null}

        <MatchTimeline matchStatus={match.status} events={events} />

        <MatchStatsPanel match={match} stats={derivedStats} />
        <MatchLineupsPanel match={match} lineups={derivedLineups} />

        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.14)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">
                  Related Links
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Jump to tournament context or watch highlights.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {match.tournamentSlug ? (
                  <>
                    <Link
                      href={`/t/${match.tournamentSlug}`}
                      className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                    >
                      View Tournament
                    </Link>
                    <Link
                      href={`/t/${match.tournamentSlug}/fixtures`}
                      className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                    >
                      View Fixtures
                    </Link>
                    <Link
                      href={`/t/${match.tournamentSlug}/standings`}
                      className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                    >
                      View Standings
                    </Link>
                    <Link
                      href={`/t/${match.tournamentSlug}/teams`}
                      className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                    >
                      View Teams
                    </Link>
                  </>
                ) : null}
                <Link
                  href={`/watch`}
                  className="inline-flex items-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25"
                >
                  Watch Highlights
                </Link>
              </div>
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
          <h3 className="text-2xl font-semibold text-red-100">
            Couldn&apos;t load match data
          </h3>
          <p className="mt-2 text-sm text-red-200/90">{message}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link
              href={`/match/${id}`}
              className="inline-flex items-center rounded-2xl bg-red-500/20 border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25"
            >
              Retry
            </Link>
            <Link
              href="/matches"
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Back to Matches
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

