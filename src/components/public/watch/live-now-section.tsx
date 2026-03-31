import Link from "next/link";
import type { WatchGridItem } from "@/src/features/media/queries/list-public-watch-media";
import { MediaCard } from "./media-card";

export function LiveNowSection({
  items,
}: {
  items: WatchGridItem[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Live Now</h2>
          <p className="mt-1 text-sm text-slate-400">
            Follow streams happening right now.
          </p>
        </div>
        <Link
          href="/matches?tab=live"
          className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
        >
          Go to Live Matches →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
          <h3 className="text-lg font-semibold text-slate-50">
            No live streams right now
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Check back during matchdays.
          </p>
          <div className="mt-7">
            <Link
              href="/matches?tab=today"
              className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              View Today&apos;s Matches →
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {items.slice(0, 10).map((i) => (
            <div key={i.id} className="w-[320px] shrink-0">
              <MediaCard item={i} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

