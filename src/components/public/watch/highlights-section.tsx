import Link from "next/link";
import type { WatchGridItem } from "@/src/features/media/queries/list-public-watch-media";
import { MediaCard } from "./media-card";

export function HighlightsSection({
  items,
}: {
  items: WatchGridItem[];
}) {
  const has = items.length > 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Highlights</h2>
          <p className="mt-1 text-sm text-slate-400">
            Recent moments from tournaments.
          </p>
        </div>
        <Link
          href="/watch?type=highlight"
          className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
        >
          View all →
        </Link>
      </div>

      {!has ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
          <h3 className="text-lg font-semibold text-slate-50">
            No highlights found
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Try changing filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 9).map((i) => (
            <MediaCard key={i.id} item={i} />
          ))}
        </div>
      )}
    </section>
  );
}

