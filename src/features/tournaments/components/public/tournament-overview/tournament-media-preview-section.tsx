import Image from "next/image";
import Link from "next/link";
import { getPublicTournamentMedia } from "@/src/features/tournaments/queries/get-public-tournament-media";

function mediaTypeBadgeClasses(type: string, isLive: boolean) {
  if (isLive) return "border-red-500/40 bg-red-500/10 text-red-100";
  if (type === "highlight") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  if (type === "vod") return "border-slate-400/20 bg-white/5 text-slate-200";
  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
}

export function TournamentMediaPreviewSection({
  slug,
  mediaPreview,
}: {
  slug: string;
  mediaPreview: Awaited<ReturnType<typeof getPublicTournamentMedia>>;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Media</h2>
          <p className="mt-1 text-sm text-slate-400">
            Streams and highlights inside this tournament.
          </p>
        </div>
        <Link
          href={`/t/${slug}/media`}
          className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
        >
          View All →
        </Link>
      </div>

      {mediaPreview.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400 backdrop-blur-md">
          No media published yet.
        </div>
      ) : (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-3 md:overflow-x-visible">
          {mediaPreview.slice(0, 6).map((m) => (
            <Link
              key={m.id}
              href={`/watch/${m.id}`}
              className="group min-w-[260px] overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:border-emerald-400/30 md:min-w-0"
            >
              <div className="relative aspect-video bg-slate-950">
                {m.thumbnailUrl ? (
                  <Image
                    src={m.thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                    No thumbnail
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent" />
                <span
                  className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-[10px] font-semibold ${mediaTypeBadgeClasses(
                    m.type,
                    m.isLive
                  )}`}
                >
                  {m.isLive
                    ? "LIVE"
                    : m.type === "highlight"
                      ? "Highlight"
                      : m.type === "vod"
                        ? "Replay"
                        : "Stream"}
                </span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/20 backdrop-blur-sm">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-slate-50"
                      aria-hidden
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {m.duration && !m.isLive ? (
                  <div className="absolute bottom-3 right-3 rounded-xl bg-slate-950/70 px-2 py-1 text-[11px] font-semibold text-slate-200">
                    {m.duration}
                  </div>
                ) : null}
              </div>
              <div className="p-4">
                <div className="line-clamp-2 text-sm font-semibold text-slate-50">
                  {m.title}
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {m.startAt ? new Date(m.startAt).toISOString().slice(0, 10) : "—"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
