import type { TiebreakRule } from "../types";
import { InlineHelp } from "./inline-help";

interface TiebreakOrderEditorProps {
  rules: TiebreakRule[];
  onChange: (rules: TiebreakRule[]) => void;
  availableRules?: { key: string; label: string }[];
  disabled?: boolean;
}

const DEFAULT_TIEBREAKS = [
  { key: "points", label: "Points" },
  { key: "goal_diff", label: "Goal difference" },
  { key: "goals_for", label: "Goals for" },
  { key: "head_to_head", label: "Head to head" },
  { key: "draw_lots", label: "Draw lots" },
];

export function TiebreakOrderEditor({
  rules,
  onChange,
  availableRules = DEFAULT_TIEBREAKS,
  disabled = false,
}: TiebreakOrderEditorProps) {
  const ordered = [...rules].sort((a, b) => a.order - b.order);
  const add = (key: string, label: string) => {
    const nextOrder = ordered.length === 0 ? 0 : Math.max(...ordered.map((r) => r.order)) + 1;
    if (ordered.some((r) => r.key === key)) return;
    onChange([...ordered, { key, label, order: nextOrder }]);
  };
  const remove = (key: string) => {
    onChange(ordered.filter((r) => r.key !== key));
  };
  const move = (key: string, dir: "up" | "down") => {
    const idx = ordered.findIndex((r) => r.key === key);
    if (idx === -1) return;
    const next = [...ordered];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[idx].order, next[swap].order] = [next[swap].order, next[idx].order];
    onChange(next.sort((a, b) => a.order - b.order));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-200">Tiebreak order</label>
      <InlineHelp>
        First criterion wins; if tied, next is used. Drag order below.
      </InlineHelp>
      <ul className="space-y-1">
        {ordered.map((r, i) => (
          <li
            key={r.key}
            className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm"
          >
            <span className="text-slate-300">
              {i + 1}. {r.label}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(r.key, "up")}
                disabled={disabled || i === 0}
                className="rounded p-1 text-slate-500 hover:bg-slate-800 disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(r.key, "down")}
                disabled={disabled || i === ordered.length - 1}
                className="rounded p-1 text-slate-500 hover:bg-slate-800 disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(r.key)}
                disabled={disabled}
                className="rounded p-1 text-red-400 hover:bg-red-950/50"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <select
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        value=""
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return;
          const opt = availableRules.find((o) => o.key === v);
          if (opt) add(opt.key, opt.label);
          e.target.value = "";
        }}
        disabled={disabled}
      >
        <option value="">Add criterion</option>
        {availableRules
          .filter((o) => !ordered.some((r) => r.key === o.key))
          .map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
      </select>
    </div>
  );
}
