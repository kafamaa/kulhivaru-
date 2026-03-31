import Link from "next/link";

export interface StreamPreview {
  id: string;
  title: string;
  tournamentName: string;
  tournamentSlug?: string;
  isLive: boolean;
  thumbnailUrl?: string | null;
  startAt?: string | null;
}

export interface HighlightPreview {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  duration?: string;
  tournamentName?: string;
}

interface WatchSectionProps {
  liveStream?: StreamPreview | null;
  highlights?: HighlightPreview[];
  isLoading?: boolean;
}

export function WatchSection({
  liveStream,
  highlights = [],
  isLoading = false,
}: WatchSectionProps) {
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <div className="mb-3 h-6 w-32 animate-pulse rounded bg-slate-900/70" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-video animate-pulse rounded-2xl bg-slate-900/70"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const hasLive = liveStream?.isLive ?? false;
  const hasHighlights = highlights.length > 0;

  if (!hasLive && !hasHighlights) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            Watch & highlights
          </h2>
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 py-12 text-center text-sm text-slate-400">
            No live stream or highlights at the moment. Check back during
            matchdays.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
        <h2 className="mb-4 text-lg font-semibold text-slate-50">
          Watch & highlights
        </h2>
        <div className="space-y-6">
        {hasLive && liveStream && (
          <div className="overflow-hidden rounded-3xl border border-emerald-500/25 bg-slate-950/60">
            <div className="relative aspect-video bg-slate-900">
              {liveStream.thumbnailUrl ? (
                <img
                  src={liveStream.thumbnailUrl}
                  alt={liveStream.title}
                  className="h-full w-full object-cover opacity-80"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/90 text-white shadow-lg">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-red-500/90 px-2 py-1 text-xs font-medium text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Live
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-50">{liveStream.title}</h3>
              <p className="text-sm text-slate-400">{liveStream.tournamentName}</p>
              <Link
                href={liveStream.tournamentSlug ? `/t/${liveStream.tournamentSlug}` : "/watch"}
                className="mt-2 inline-block text-sm font-medium text-emerald-300 hover:text-emerald-200"
              >
                Watch now →
              </Link>
            </div>
          </div>
        )}
        {hasHighlights && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-200">
              Recent highlights
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.slice(0, 6).map((h) => (
                <Link
                  key={h.id}
                  href={`/watch/${h.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 transition-colors hover:border-emerald-400/30"
                >
                  <div className="aspect-video bg-slate-900">
                    {h.thumbnailUrl ? (
                      <img
                        src={h.thumbnailUrl}
                        alt={h.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-900" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white text-white">
                        <svg className="ml-1 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    {h.duration && (
                      <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-slate-200">
                        {h.duration}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {h.title}
                    </p>
                    {h.tournamentName && (
                      <p className="truncate text-xs text-slate-400">
                        {h.tournamentName}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href="/watch"
              className="mt-3 inline-block text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              View all →
            </Link>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
