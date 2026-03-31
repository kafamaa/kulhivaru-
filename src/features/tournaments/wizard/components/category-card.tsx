import type { WizardCategory } from "../types";

interface CategoryCardProps {
  category: WizardCategory;
  onEdit: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  disabled?: boolean;
}

export function CategoryCard({
  category,
  onEdit,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  disabled = false,
}: CategoryCardProps) {
  const displayName = category.name.trim() || "Unnamed category";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              disabled={disabled || !canMoveUp}
              className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 disabled:opacity-40"
              aria-label="Move up"
            >
              ↑
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              disabled={disabled || !canMoveDown}
              className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 disabled:opacity-40"
              aria-label="Move down"
            >
              ↓
            </button>
          )}
          <h4 className="font-medium text-slate-100">{displayName}</h4>
          {category.shortLabel && (
            <span className="text-xs text-slate-500">({category.shortLabel})</span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {category.maxTeams} teams · roster {category.rosterMin}–{category.rosterMax} ·{" "}
          {category.matchDurationMinutes} min matches
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          disabled={disabled}
          className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="rounded-lg border border-red-800 px-2 py-1.5 text-xs font-medium text-red-300 hover:bg-red-950/50"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
