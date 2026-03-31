import Image from "next/image";
import Link from "next/link";
import type { WatchGridItem } from "@/src/features/media/queries/list-public-watch-media";
import { MediaTypeBadge } from "./media-type-badge";

function PlayOverlay({ kind }: { kind: "play" | "watch" }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full border shadow-lg ${
          kind === "watch"
            ? "border-red-400/30 bg-red-500/20 text-red-100"
            : "border-white/15 bg-black/30 text-white"
        }`}
      >
        <svg
          className="h-6 w-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}

export function MediaCard({ item }: { item: WatchGridItem }) {
  const href = `/watch/${item.id}`;
  const isLive = item.isLive;

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md hover:border-emerald-400/30 transition-colors"
      aria-label={`Open ${item.title}`}
    >
      <div className="relative aspect-video bg-slate-900/40">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-900 to-slate-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-[10px] font-semibold text-red-100">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              LIVE
            </span>
          ) : null}
          <MediaTypeBadge type={item.type} isLive={item.isLive} />
        </div>

        <PlayOverlay kind={isLive ? "watch" : "play"} />

        {item.duration ? (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-slate-200">
            {item.duration}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-50">
              {item.title}
            </h3>
            {item.tournamentName ? (
              <p className="mt-1 truncate text-xs text-slate-400">
                {item.tournamentName}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">Kulhivaru+</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

