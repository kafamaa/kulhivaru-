export function MediaTypeBadge({
  type,
  isLive,
}: {
  type: "stream" | "highlight" | "vod";
  isLive: boolean;
}) {
  const cls = (() => {
    if (isLive) return "border-red-500/40 bg-red-500/10 text-red-100";
    if (type === "highlight")
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    if (type === "vod") return "border-slate-400/20 bg-white/5 text-slate-200";
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  })();

  const label = (() => {
    if (isLive) return "LIVE";
    if (type === "highlight") return "Highlight";
    if (type === "vod") return "Replay";
    return "Stream";
  })();

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

