import type { SaveState } from "../types";

interface SaveStateBadgeProps {
  state: SaveState;
  className?: string;
}

export function SaveStateBadge({ state, className = "" }: SaveStateBadgeProps) {
  const config = {
    idle: { label: "Draft", className: "text-slate-400" },
    saving: { label: "Saving…", className: "text-amber-400" },
    saved: { label: "Saved", className: "text-emerald-400" },
    error: { label: "Error", className: "text-red-400" },
  }[state];

  return (
    <span
      className={`inline-flex items-center text-xs font-medium ${config.className} ${className}`}
      aria-live="polite"
    >
      {config.label}
    </span>
  );
}
