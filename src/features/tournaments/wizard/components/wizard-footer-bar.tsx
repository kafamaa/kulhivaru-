"use client";

import type { WizardStepId } from "../types";
import { STEP_LABELS } from "../types";

interface WizardFooterBarProps {
  currentStep: WizardStepId;
  canGoNext: boolean;
  canGoPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  onPublish?: () => void;
  isPublishStep?: boolean;
  isPublishing?: boolean;
}

export function WizardFooterBar({
  currentStep,
  canGoNext,
  canGoPrev,
  onNext,
  onPrev,
  onPublish,
  isPublishStep = false,
  isPublishing = false,
}: WizardFooterBarProps) {
  const nextLabel = isPublishStep ? "Publish" : "Continue";
  const isNextDisabled = isPublishStep ? isPublishing : !canGoNext;

  return (
    <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-slate-800 bg-slate-950/95 px-4 py-4 backdrop-blur">
      <div>
        {canGoPrev && !isPublishStep && (
          <button
            type="button"
            onClick={onPrev}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            ← {STEP_LABELS[currentStep] ? "Back" : "Previous"}
          </button>
        )}
      </div>
      <div className="flex gap-2">
        {isPublishStep && onPublish ? (
          <button
            type="button"
            onClick={onPublish}
            disabled={isNextDisabled}
            className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {isPublishing ? "Publishing…" : "Publish tournament"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
            className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {nextLabel} →
          </button>
        )}
      </div>
    </footer>
  );
}
