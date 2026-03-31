import Link from "next/link";
import type { WatchGridItem, WatchMediaType } from "@/src/features/media/queries/list-public-watch-media";
import { MediaCard } from "./media-card";
import { MediaCardSkeleton } from "./media-card-skeleton";

export function MediaGrid({
  items,
  type,
}: {
  items: WatchGridItem[];
  type: WatchMediaType;
}) {
  const has = items.length > 0;
  const title =
    type === "live"
      ? "Live streams"
      : type === "highlight"
        ? "Highlights"
        : type === "replay"
          ? "Replays"
          : "All media";

  if (!has) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
        <h3 className="text-xl font-semibold text-slate-50">No media found</h3>
        <p className="mt-2 text-sm text-slate-400">Try changing filters.</p>
        <div className="mt-7">
          <Link
            href="/watch"
            className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Clear filters →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
        <div className="text-xs text-slate-400">Showing {items.length}</div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((i) => (
          <MediaCard key={i.id} item={i} />
        ))}
      </div>
    </section>
  );
}

export function MediaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

