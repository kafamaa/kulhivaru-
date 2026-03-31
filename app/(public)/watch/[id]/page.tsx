import Link from "next/link";
import Image from "next/image";
import { getPublicWatchMediaDetail } from "@/src/features/media/queries/list-public-watch-media";

interface WatchMediaDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatStartAt(startAt: string | null) {
  if (!startAt) return null;
  const d = new Date(startAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export default async function WatchMediaDetailPage({
  params,
}: WatchMediaDetailPageProps) {
  const { id } = await params;
  const media = await getPublicWatchMediaDetail({ mediaId: id });

  if (!media) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
          <h1 className="text-xl font-semibold text-slate-50">
            Media not found
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            This media item may have been removed.
          </p>
          <div className="mt-7">
            <Link
              href="/watch"
              className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Back to Watch →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const startLabel = formatStartAt(media.startAt);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">
            {media.title}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {media.tournamentName ?? "Kulhivaru+"}
            {startLabel ? ` · ${startLabel} UTC` : ""}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Media ID: <span className="font-mono">{media.id}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/watch"
            className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Back to Watch
          </Link>
          {media.tournamentSlug ? (
            <Link
              href={`/t/${media.tournamentSlug}`}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Open Tournament
            </Link>
          ) : null}
        </div>
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950">
          {media.thumbnailUrl ? (
            <Image
              src={media.thumbnailUrl}
              alt=""
              fill
              className="object-cover opacity-90"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-900 to-slate-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
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
        </div>

        {media.streamUrl ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-50">
                Watch {media.type === "live" ? "Live" : media.type}
              </span>
              <span className="text-xs text-slate-400">
                Status: {media.isLive ? "Live now" : "Replay"}
              </span>
            </div>
            <div className="relative w-full overflow-hidden rounded-2xl">
              <iframe
                title={media.title}
                src={media.streamUrl}
                className="h-[360px] w-full border-0 bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-slate-300">
            <p>
              Watch link isn&apos;t available for this media type yet. Please use{" "}
              <Link href={`/watch/${media.id}`} className="text-emerald-300 hover:text-emerald-200">
                this item&apos;s page
              </Link>
              .
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

