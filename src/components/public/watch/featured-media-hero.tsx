import Link from "next/link";
import type { WatchGridItem } from "@/src/features/media/queries/list-public-watch-media";
import { MediaTypeBadge } from "./media-type-badge";

function formatStartAtUtc(startAt: string | null) {
  if (!startAt) return null;
  const d = new Date(startAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export function FeaturedMediaHero({
  featured,
}: {
  featured: WatchGridItem | null;
}) {
  if (!featured) return null;

  const isLive = featured.isLive;
  const startLabel = formatStartAtUtc(featured.startAt);

  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_30px_140px_rgba(0,0,0,0.45)]">
        <div className="relative aspect-video bg-slate-900/50">
          {featured.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featured.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover opacity-90"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-900 to-slate-950" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white shadow-lg">
              <svg
                className="h-7 w-7"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          <div className="absolute left-4 top-4 flex items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-[10px] font-semibold text-red-100">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                LIVE
              </span>
            ) : (
              <MediaTypeBadge type={featured.type} isLive={featured.isLive} />
            )}
          </div>
        </div>

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-slate-50">
                {featured.title}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                {featured.tournamentName ?? "Kulhivaru+"}
                {startLabel && !isLive ? ` · ${startLabel} UTC` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/watch/${featured.id}`}
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold ${
                  isLive
                    ? "bg-red-500/20 border border-red-400/30 text-red-100 hover:bg-red-500/25"
                    : "bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 hover:bg-emerald-500/25"
                }`}
              >
                {isLive ? "Watch Live" : "Watch"} →
              </Link>
              <Link
                href={featured.tournamentSlug ? `/t/${featured.tournamentSlug}` : "/explore"}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                Open Tournament →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

