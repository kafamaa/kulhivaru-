import Link from "next/link";
import type { ReactNode } from "react";

interface ReviewSummaryCardProps {
  title: string;
  stepId: string;
  editHref: string;
  children: ReactNode;
  complete?: boolean;
  className?: string;
}

export function ReviewSummaryCard({
  title,
  stepId,
  editHref,
  children,
  complete = true,
  className = "",
}: ReviewSummaryCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/40 p-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <Link
          href={editHref}
          className="shrink-0 text-xs font-medium text-emerald-400 hover:text-emerald-300"
        >
          Edit
        </Link>
      </div>
      <div className="mt-3 text-sm text-slate-400">
        {children}
      </div>
      {!complete && (
        <p className="mt-2 text-xs text-amber-400">Incomplete — edit to fix.</p>
      )}
    </div>
  );
}
