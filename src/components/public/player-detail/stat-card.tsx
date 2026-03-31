import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium text-slate-400">{label}</div>
        {icon ? <div className="text-base">{icon}</div> : null}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-50 tabular-nums">
        {value}
      </div>
    </div>
  );
}

