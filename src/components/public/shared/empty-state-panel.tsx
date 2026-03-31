import type { ReactNode } from "react";

export function EmptyStatePanel({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
      <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
      {description ? (
        <div className="mt-2 text-sm text-slate-400">{description}</div>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

