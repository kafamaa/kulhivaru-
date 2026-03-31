import { CompletionIndicator } from "./completion-indicator";
import { WarningList } from "./warning-list";
import type { WizardReviewState } from "../types";

interface PublishChecklistProps {
  review: WizardReviewState;
  stepsComplete: Record<string, boolean>;
  className?: string;
}

const STEP_LABELS: Record<string, string> = {
  basics: "Basics",
  categories: "Categories",
  registration: "Registration",
  format: "Format & Rules",
};

export function PublishChecklist({
  review,
  stepsComplete,
  className = "",
}: PublishChecklistProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-slate-200">Checklist</h3>
        <ul className="mt-2 space-y-1">
          {Object.entries(STEP_LABELS).map(([key, label]) => (
            <li key={key}>
              <CompletionIndicator
                complete={stepsComplete[key] ?? false}
                label={label}
              />
            </li>
          ))}
        </ul>
      </div>
      {review.blockers.length > 0 && (
        <WarningList items={review.blockers} type="blocker" />
      )}
      {review.warnings.length > 0 && (
        <WarningList items={review.warnings} type="warning" />
      )}
    </div>
  );
}
