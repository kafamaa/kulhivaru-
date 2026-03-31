import Link from "next/link";
import { Suspense } from "react";
import type {
  WatchMediaType,
  WatchGridItem,
} from "@/src/features/media/queries/list-public-watch-media";
import {
  getHighlightsPreview,
} from "@/src/features/media/queries/get-watch-preview";
import {
  listPublicLiveStreams,
  listPublicWatchMedia,
  listPublicWatchTournamentOptions,
} from "@/src/features/media/queries/list-public-watch-media";
import { FeaturedMediaHero } from "@/src/components/public/watch/featured-media-hero";
import { LiveNowSection } from "@/src/components/public/watch/live-now-section";
import { HighlightsSection } from "@/src/components/public/watch/highlights-section";
import { MediaFilterToolbar } from "@/src/components/public/watch/media-filter-toolbar";
import { MediaGrid, MediaGridSkeleton } from "@/src/components/public/watch/media-grid";
import { MatchErrorState } from "@/src/components/public/match-center/match-error-state";

type SearchParamsValue = Record<string, string | string[] | undefined>;

function getString(sp: SearchParamsValue | undefined, key: string): string | undefined {
  if (!sp) return undefined;
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function parseWatchType(input: string | undefined): WatchMediaType {
  if (input === "live" || input === "highlight" || input === "replay") return input;
  return "all";
}

async function WatchGridSection(input: {
  type: WatchMediaType;
  tournamentSlug?: string | null;
  date?: string | null;
  page: number;
  limit: number;
}) {
  const offset = (input.page - 1) * input.limit;
  const res = await listPublicWatchMedia({
    type: input.type,
    tournamentSlug: input.tournamentSlug ?? undefined,
    date: input.date ?? undefined,
    limit: input.limit,
    offset,
  });

  if (res.error) {
    return (
      <MatchErrorState message={res.error} />
    );
  }

  const loadMoreHref = (() => {
    const params = new URLSearchParams();
    if (input.type !== "all") params.set("type", input.type);
    if (input.tournamentSlug) params.set("tournament", input.tournamentSlug);
    if (input.date) params.set("date", input.date);
    params.set("page", String(input.page + 1));
    return `/watch?${params.toString()}`;
  })();

  return (
    <>
      <MediaGrid items={res.items} type={input.type} />
      {res.items.length === input.limit ? (
        <div className="mx-auto max-w-7xl px-4 pb-8">
          <Link
            href={loadMoreHref}
            className="mx-auto flex max-w-xs items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Load more
          </Link>
        </div>
      ) : null}
    </>
  );
}

export default async function WatchPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsValue | undefined> | SearchParamsValue | undefined;
}) {
  const sp = searchParams ? await searchParams : undefined;

  const type = parseWatchType(getString(sp, "type"));
  const tournamentSlug = getString(sp, "tournament") ?? null;
  const date = getString(sp, "date") ?? null;

  const pageRaw = getString(sp, "page");
  const page = pageRaw ? Math.max(1, Number(pageRaw)) : 1;
  const limit = 12;

  const [tournamentOptions, liveStreams, featuredFromLive, highlightsPreview] =
    await Promise.all([
      listPublicWatchTournamentOptions({ limit: 50 }),
      listPublicLiveStreams({ tournamentSlug, limit: 10 }),
      listPublicLiveStreams({ tournamentSlug, limit: 1 }),
      // keep highlights section consistent with old preview shape where possible
      getHighlightsPreview(6),
    ]);

  // Use the first live stream as featured hero.
  const featuredHero: WatchGridItem | null =
    featuredFromLive[0] ?? null;

  const highlightsForSection: WatchGridItem[] = highlightsPreview.map((h) => ({
    id: h.id,
    type: "highlight",
    title: h.title,
    thumbnailUrl: h.thumbnailUrl ?? null,
    duration: h.duration ?? null,
    isLive: false,
    startAt: null,
    tournamentName: h.tournamentName ?? null,
    tournamentSlug: null,
  }));

  const featuredOrFallback: WatchGridItem | null =
    featuredHero ?? highlightsForSection[0] ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              Watch & Highlights
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Watch live moments, highlights, and replays from Kulhivaru+.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              Live Now: {liveStreams.length}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              Highlights: {highlightsForSection.length}
            </span>
          </div>
        </div>
      </section>

      {/* Featured hero */}
      <FeaturedMediaHero featured={featuredOrFallback} />

      {/* Live Now rail */}
      <LiveNowSection items={liveStreams} />

      {/* Highlights */}
      <HighlightsSection items={highlightsForSection} />

      {/* Sticky filters + grid */}
      <MediaFilterToolbar
        initial={{
          type,
          tournamentSlug,
          date,
        }}
        tournamentOptions={tournamentOptions}
        resultsCountLabel="Filter and browse all media"
      />

      <Suspense
        fallback={<MediaGridSkeleton count={12} />}
      >
        <WatchGridSection
          type={type}
          tournamentSlug={tournamentSlug}
          date={date}
          page={page}
          limit={limit}
        />
      </Suspense>
    </div>
  );
}

