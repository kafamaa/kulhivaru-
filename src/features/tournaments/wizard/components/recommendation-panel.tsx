import type { ReactNode } from "react";

interface RecommendationPanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function RecommendationPanel({
  title = "Recommendation",
  children,
  className = "",
}: RecommendationPanelProps) {
  return (
    <div
      className={`rounded-xl border border-emerald-800/50 bg-emerald-950/20 p-4 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
        {title}
      </p>
      <div className="mt-2 text-sm text-slate-300">{children}</div>
    </div>
  );
}
