import type { FormatType } from "../types";

interface FormatOptionCardProps {
  formatType: FormatType;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const FORMAT_LABELS: Record<FormatType, string> = {
  round_robin: "Round robin",
  groups_knockout: "Groups + knockout",
  knockout_only: "Knockout only",
  custom: "Custom",
};

export function FormatOptionCard({
  formatType,
  title,
  description,
  selected,
  onSelect,
  disabled = false,
}: FormatOptionCardProps) {
  const label = FORMAT_LABELS[formatType] ?? title;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/50"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
            selected ? "border-emerald-500 bg-emerald-500" : "border-slate-600"
          }`}
        >
          {selected && <span className="text-[10px] text-slate-950">✓</span>}
        </span>
        <span className="font-medium text-slate-100">{label}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </button>
  );
}
