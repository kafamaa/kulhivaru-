"use client";

import type { WizardStepId } from "../types";
import { STEP_LABELS } from "../types";

interface WizardStepperProps {
  currentStep: WizardStepId;
  stepOrder: WizardStepId[];
  onStepClick?: (step: WizardStepId) => void;
  canNavigateToStep?: (step: WizardStepId) => boolean;
}

export function WizardStepper({
  currentStep,
  stepOrder,
  onStepClick,
  canNavigateToStep = () => true,
}: WizardStepperProps) {
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <nav
      className="border-b border-slate-800 bg-slate-900/30 px-4 py-3"
      aria-label="Wizard steps"
    >
      <ol className="flex flex-wrap items-center gap-2 sm:gap-4">
        {stepOrder.map((stepId, index) => {
          const isCurrent = stepId === currentStep;
          const isPast = index < currentIndex;
          const isClickable = onStepClick && (isPast || isCurrent) && canNavigateToStep(stepId);
          const label = STEP_LABELS[stepId] ?? stepId;

          return (
            <li key={stepId} className="flex items-center gap-2">
              {index > 0 && (
                <span
                  className="hidden h-px w-4 bg-slate-700 sm:block"
                  aria-hidden
                />
              )}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(stepId)}
                disabled={!isClickable}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-emerald-500/20 text-emerald-300"
                    : isPast
                      ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      : "text-slate-600"
                } ${!isClickable ? "cursor-default" : ""}`}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                    isCurrent
                      ? "bg-emerald-500 text-slate-950"
                      : isPast
                        ? "bg-slate-600 text-slate-200"
                        : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {isPast ? "✓" : index + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
