"use client";

import Link from "next/link";
import { SaveStateBadge } from "./save-state-badge";
import type { SaveState } from "../types";

interface WizardHeaderProps {
  saveState: SaveState;
  onSaveDraft: () => void;
  isSaving?: boolean;
  organizationName?: string | null;
  organizationId?: string | null;
}

export function WizardHeader({
  saveState,
  onSaveDraft,
  isSaving = false,
  organizationName = null,
  organizationId = null,
}: WizardHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-800 bg-slate-950/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Link
          href="/organizer/tournaments"
          className="text-slate-400 hover:text-slate-200"
          aria-label="Back to tournaments"
        >
          ← Back
        </Link>
        <span className="text-slate-600" aria-hidden>|</span>
        <h1 className="text-lg font-semibold text-slate-50">
          Create tournament
        </h1>
        {organizationName && organizationId && (
          <span
            className="hidden items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 md:inline-flex"
            title={`Organization ID: ${organizationId}`}
          >
            <span className="text-slate-500">Org</span>
            <span className="font-medium text-slate-200">{organizationName}</span>
            <span className="font-mono text-[11px] text-slate-500">
              {organizationId.slice(0, 8)}…
            </span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <SaveStateBadge state={saveState} />
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving || saveState === "saving"}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          {saveState === "saving" ? "Saving…" : "Save draft"}
        </button>
      </div>
    </header>
  );
}
