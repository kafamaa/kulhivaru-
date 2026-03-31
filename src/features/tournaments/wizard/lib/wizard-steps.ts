import type { WizardStepId, WizardDraft } from "../types";
import { WIZARD_STEP_ORDER } from "../types";

export function getStepIndex(stepId: WizardStepId): number {
  const i = WIZARD_STEP_ORDER.indexOf(stepId);
  return i === -1 ? 0 : i;
}

export function getStepId(index: number): WizardStepId | null {
  if (index < 0 || index >= WIZARD_STEP_ORDER.length) return null;
  return WIZARD_STEP_ORDER[index];
}

export function getNextStepId(current: WizardStepId): WizardStepId | null {
  return getStepId(getStepIndex(current) + 1);
}

export function getPrevStepId(current: WizardStepId): WizardStepId | null {
  return getStepId(getStepIndex(current) - 1);
}

export function canProceedFromStep(stepId: WizardStepId, draft: WizardDraft): boolean {
  switch (stepId) {
    case "basics":
      return (
        draft.basics.tournamentName.length >= 3 &&
        draft.basics.sport.length >= 1 &&
        draft.basics.startDate.length >= 1 &&
        draft.basics.endDate.length >= 1
      );
    case "categories":
      return draft.categories.length >= 1 && draft.categories.every((c) => c.name.trim().length >= 2);
    case "registration":
      return true;
    case "format":
      return (
        draft.formatRules.length >= draft.categories.length &&
        draft.categories.every((c) =>
          draft.formatRules.some((f) => f.categoryId === c.id)
        )
      );
    case "review":
      return true;
    default:
      return false;
  }
}

export function isStepComplete(stepId: WizardStepId, draft: WizardDraft): boolean {
  return canProceedFromStep(stepId, draft);
}
