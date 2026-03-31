 "use client";

import type { TournamentMediaListItem, TournamentMediaFeaturedPick } from "@/src/features/tournaments/queries/list-public-tournament-media";
import { MediaTypeBadge } from "./media-type-badge";
import Image from "next/image";

export function FeaturedMediaStrip({
  pick,
  onOpen,
}: {
  pick: TournamentMediaFeaturedPick;
  onOpen: (item: TournamentMediaListItem) => void;
}) {
  const large = pick.featuredLarge;
  const supporting = pick.supporting;

  if (!large && supporting.length === 0) return null;

  const renderCard = (m: TournamentMediaListItem, variant: "large" | "small") => {
    const badge = <MediaTypeBadge type={m.type} isLive={m.isLive} />;
    const isSmall = variant === "small";
    return (
      <div
        key={m.id}
        className={`group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:border-emerald-400/30 ${isSmall ? "" : ""}`}
        onClick={() => onOpen(m)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpen(m);
        }}
      >
        <div className={`relative ${isSmall ? "aspect-video" : "aspect-video"} bg-slate-950`}>
          {m.thumbnailUrl ? (
            <Image src={m.thumbnailUrl} alt="" fill className="object-cover opacity-90" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">No thumbnail</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/25 to-transparent" />
          <div className="absolute left-4 top-4 z-20">{badge}</div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/20 text-slate-50 backdrop-blur-sm">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          {m.isLive ? (
            <div className="absolute bottom-4 left-4 z-20">
              <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-100">
                LIVE
              </span>
            </div>
          ) : m.duration ? (
            <div className="absolute bottom-4 right-4 z-20 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-1 text-[11px] font-semibold text-slate-200">
              {m.duration}
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <div className="line-clamp-2 text-sm font-semibold text-slate-50">
            {m.title}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Featured</h2>
            <p className="mt-1 text-sm text-slate-400">
              The best highlights and live moments first.
            </p>
          </div>
          <div className="text-[11px] text-slate-400">
            Click a card to open.
          </div>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {large ? renderCard(large, "large") : null}
          {supporting.map((m) => renderCard(m, "small"))}
        </div>
      </div>
    </section>
  );
}

