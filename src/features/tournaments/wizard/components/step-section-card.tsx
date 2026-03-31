import type { ReactNode } from "react";

interface StepSectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function StepSectionCard({
  title,
  description,
  children,
  className = "",
}: StepSectionCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/40 p-5 ${className}`}
    >
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}
