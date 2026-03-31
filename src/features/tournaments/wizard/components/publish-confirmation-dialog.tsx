"use client";

interface PublishConfirmationDialogProps {
  open: boolean;
  tournamentName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPublishing?: boolean;
  error?: string | null;
}

export function PublishConfirmationDialog({
  open,
  tournamentName,
  onConfirm,
  onCancel,
  isPublishing = false,
  error = null,
}: PublishConfirmationDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
        <h2 id="publish-dialog-title" className="text-lg font-semibold text-slate-50">
          Publish tournament
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          &ldquo;{tournamentName || "Untitled"}&rdquo; will be published and visible
          according to your visibility settings. You can still edit it afterward.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Make sure dates, categories, and registration settings are correct.
        </p>
        {error && (
          <p className="mt-3 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPublishing}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPublishing}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {isPublishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
