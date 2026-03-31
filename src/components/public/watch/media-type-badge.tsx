import type { WatchGridItemType } from "@/src/features/media/queries/list-public-watch-media";

export function MediaTypeBadge({ type, isLive }: { type: WatchGridItemType; isLive: boolean }) {
  const label =
    type === "live"
      ? isLive
        ? "LIVE"
        : "Stream"
      : type === "highlight"
        ? "Highlight"
        : "Replay";

  const cls =
    type === "live"
      ? isLive
        ? "border-red-400/30 bg-red-500/10 text-red-100"
        : "border-white/15 bg-white/5 text-slate-200"
      : type === "highlight"
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
        : "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${cls}`}
      aria-label={label}
    >
      {label}
    </span>
  );
}

