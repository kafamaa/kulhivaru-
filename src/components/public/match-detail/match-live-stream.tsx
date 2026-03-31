import Image from "next/image";
import Link from "next/link";

export interface PublicMatchLiveStream {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  duration: string | null;
  startAt: string | null;
  tournamentSlug: string | null;
}

export function MatchLiveStream({
  stream,
}: {
  stream: PublicMatchLiveStream;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="rounded-3xl border border-red-400/30 bg-red-500/5 p-4 backdrop-blur-md shadow-[0_25px_100px_rgba(239,68,68,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-[11px] font-bold text-red-100">
                LIVE STREAM
              </span>
              {stream.duration ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">
                  {stream.duration}
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 truncate text-lg font-semibold text-slate-50">
              {stream.title}
            </h2>
            {stream.startAt ? (
              <p className="mt-1 text-sm text-slate-300">
                Started: {new Date(stream.startAt).toISOString().slice(0, 16).replace("T", " ")} UTC
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="relative h-20 w-full sm:h-24 sm:w-44 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {stream.thumbnailUrl ? (
                <Image
                  src={stream.thumbnailUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-300 font-bold">
                  LIVE
                </div>
              )}
            </div>
            <Link
              href={`/watch/${stream.id}`}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-red-500/15 border border-red-400/30 px-5 py-3 text-sm font-semibold text-red-100 hover:bg-red-500/25"
            >
              Watch Live →
            </Link>
            <a
              href="#match-timeline"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Open Match
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

