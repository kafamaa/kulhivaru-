"use client";

import { useMemo, useState } from "react";

import type {
  TournamentMediaCounts,
  TournamentMediaListItem,
  TournamentMediaFeaturedPick,
  TournamentMediaListResult,
  TournamentMediaSort,
  TournamentMediaTypeFilter,
} from "@/src/features/tournaments/queries/list-public-tournament-media";

import { TournamentSubNav } from "@/src/features/tournaments/components/public/tournament-overview/tournament-sub-nav";
import { TournamentMediaFilterBar } from "./tournament-media-filter-bar";
import { FeaturedMediaStrip } from "./featured-media-strip";
import { TournamentMediaCard } from "./media-card";
import { MediaLightboxModal } from "./media-lightbox-modal";

export function TournamentMediaGallery({
  slug,
  tournament,
  featured,
  items,
  counts,
  page,
  limit,
  total,
  loadMoreHref,
  initialType,
  initialSort,
}: {
  slug: string;
  tournament: {
    name: string;
    status: string;
  };
  featured: TournamentMediaFeaturedPick;
  items: TournamentMediaListItem[];
  counts: TournamentMediaCounts;
  page: number;
  limit: number;
  total: number;
  loadMoreHref: string | null;
  initialType: TournamentMediaTypeFilter;
  initialSort: TournamentMediaSort;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selected, setSelected] = useState<TournamentMediaListItem | null>(null);

  const open = (item: TournamentMediaListItem) => {
    setSelected(item);
    setLightboxOpen(true);
  };

  const close = () => {
    setLightboxOpen(false);
    setSelected(null);
  };

  const statusBadge = useMemo(() => {
    const s = tournament.status;
    if (s === "ongoing") {
      return "Ongoing";
    }
    if (s === "upcoming") {
      return "Upcoming";
    }
    if (s === "completed") {
      return "Completed";
    }
    return "Live";
  }, [tournament.status]);

  const hasMore = Boolean(loadMoreHref);

  return (
    <div className="space-y-6">
      {/* 2. Tournament Header (compact) + 3. subnav */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  Media
                </span>
                <span className="text-sm font-semibold text-slate-50 truncate">
                  {tournament.name}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Watch highlights, browse replays, and revisit tournament moments.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200">
                {statusBadge}
              </span>
              <a
                href={`/t/${slug}`}
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
              >
                ← Overview
              </a>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              {counts.videos} Videos
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              {counts.highlights} Highlights
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              {counts.liveStreams} Live Streams
            </span>
          </div>
        </div>
      </section>

      <TournamentSubNav slug={slug} active="media" />

      <FeaturedMediaStrip pick={featured} onOpen={open} />

      {/* 8. Filter Toolbar */}
      <TournamentMediaFilterBar
        initialType={initialType}
        initialSort={initialSort}
      />

      {/* 9. Media Grid / Gallery */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <span className="text-xl">⧉</span>
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-50">No media available yet</h3>
            <p className="mt-2 text-sm text-slate-400">
              Photos and highlights will appear here once uploaded by organizers.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => (
              <TournamentMediaCard key={m.id} item={m} onOpen={open} />
            ))}
          </div>
        )}

        {/* 10. Pagination */}
        {items.length > 0 ? (
          <div className="mt-10 flex justify-center">
            {hasMore ? (
              <a
                href={loadMoreHref ?? undefined}
                className="inline-flex items-center rounded-2xl bg-white/5 border border-white/10 px-8 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                Load more →
              </a>
            ) : (
              <div className="text-xs text-slate-400">
                End of gallery.
              </div>
            )}
          </div>
        ) : null}
      </section>

      <MediaLightboxModal open={lightboxOpen} item={selected} onClose={close} />
    </div>
  );
}

