import Image from "next/image";

import type { TournamentMediaListItem } from "@/src/features/tournaments/queries/list-public-tournament-media";
import { MediaTypeBadge } from "./media-type-badge";

export function TournamentMediaCard({
  item,
  onOpen,
}: {
  item: TournamentMediaListItem;
  onOpen: (item: TournamentMediaListItem) => void;
}) {
  const badge = <MediaTypeBadge type={item.type} isLive={item.isLive} />;

  const hasVideo = Boolean(item.streamUrl);

  return (
    <article
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:border-emerald-400/30"
      aria-label={item.title}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(item);
      }}
    >
      <div className="relative aspect-video bg-slate-950">
        {item.thumbnailUrl ? (
          <Image src={item.thumbnailUrl} alt="" fill className="object-cover opacity-90" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">No thumbnail</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/30 to-transparent" />

        <div className="absolute left-4 top-4 z-20">{badge}</div>

        {item.isLive ? (
          <div className="absolute bottom-4 left-4 z-20">
            <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-100">
              LIVE
            </span>
          </div>
        ) : item.duration ? (
          <div className="absolute bottom-4 right-4 z-20 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-1 text-[11px] font-semibold text-slate-200">
            {item.duration}
          </div>
        ) : null}

        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/20 text-slate-50 backdrop-blur-sm">
            {hasVideo ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                <path d="M12 2l2.39 6.93H22l-5.64 4.1L18.73 22 12 17.77 5.27 22l2.37-8.87L2 8.93h7.61z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-40 p-4">
        <div className="line-clamp-2 text-sm font-semibold text-slate-50 group-hover:text-slate-50">
          {item.title}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-300">
          {item.startAt ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {new Date(item.startAt).toISOString().slice(0, 10)}
            </span>
          ) : null}
          <span className="text-emerald-200">{item.isLive ? "Watch Live →" : "Open →"}</span>
        </div>
      </div>
    </article>
  );
}

