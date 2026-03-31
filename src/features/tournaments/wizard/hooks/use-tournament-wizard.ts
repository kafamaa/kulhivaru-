"use client";

import { useState, useCallback } from "react";
import type { WizardDraft, WizardStepId, SaveState } from "../types";
import { WIZARD_STEP_ORDER } from "../types";
import {
  getEmptyDraft,
  getSportCategoryDefaults,
  getSportFormatDefaults,
} from "../lib/wizard-defaults";
import {
  getStepIndex,
  getNextStepId,
  getPrevStepId,
  canProceedFromStep,
} from "../lib/wizard-steps";
import { saveTournamentDraftAction } from "../actions/save-tournament-draft";
import { publishTournamentAction } from "../actions/publish-tournament";

interface UseTournamentWizardOptions {
  initialDraft?: Partial<WizardDraft> | null;
  organizationId?: string | null;
}

export function useTournamentWizard(options: UseTournamentWizardOptions = {}) {
  const { initialDraft, organizationId } = options;
  const [draft, setDraft] = useState<WizardDraft>(() => {
    const empty = getEmptyDraft(organizationId);
    if (initialDraft) {
      return {
        ...empty,
        ...initialDraft,
        basics: { ...empty.basics, ...initialDraft.basics },
        categories: initialDraft.categories ?? empty.categories,
        registration: { ...empty.registration, ...initialDraft.registration },
        formatRules: initialDraft.formatRules ?? empty.formatRules,
        ruleConfig: {
          ...empty.ruleConfig,
          ...initialDraft.ruleConfig,
          tournament: {
            ...empty.ruleConfig.tournament,
            ...initialDraft.ruleConfig?.tournament,
          },
          categories:
            initialDraft.ruleConfig?.categories ?? empty.ruleConfig.categories,
          phases: initialDraft.ruleConfig?.phases ?? empty.ruleConfig.phases,
        },
      };
    }
    return empty;
  });
  const [currentStep, setCurrentStep] = useState<WizardStepId>("basics");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const stepIndex = getStepIndex(currentStep);
  const canGoNext = canProceedFromStep(currentStep, draft);
  const nextStepId = getNextStepId(currentStep);
  const prevStepId = getPrevStepId(currentStep);

  const goNext = useCallback(() => {
    if (nextStepId && canGoNext) setCurrentStep(nextStepId);
  }, [nextStepId, canGoNext]);

  const goPrev = useCallback(() => {
    if (prevStepId) setCurrentStep(prevStepId);
  }, [prevStepId]);

  const goToStep = useCallback((step: WizardStepId) => {
    const idx = WIZARD_STEP_ORDER.indexOf(step);
    if (idx !== -1) setCurrentStep(step);
  }, []);

  const updateBasics = useCallback((basics: WizardDraft["basics"]) => {
    setDraft((prev) => ({ ...prev, basics }));
  }, []);

  const applySportRuleTemplate = useCallback(
    (sport: string, ruleConfig: Record<string, unknown>, templateVersion?: number) => {
      const categoryDefaults = getSportCategoryDefaults(sport);
      const formatDefaults = getSportFormatDefaults(sport);
      setDraft((prev) => ({
        ...prev,
        basics: { ...prev.basics, sport },
        categories: prev.categories.map((c) => ({
          ...c,
          rosterMin: categoryDefaults.rosterMin,
          rosterMax: categoryDefaults.rosterMax,
          matchDurationMinutes: categoryDefaults.matchDurationMinutes,
        })),
        formatRules: prev.formatRules.map((f) => ({
          ...f,
          matchDurationMinutes: formatDefaults.matchDurationMinutes,
          breakDurationMinutes: formatDefaults.breakDurationMinutes,
        })),
        ruleConfig: {
          ...prev.ruleConfig,
          tournament: {
            sport,
            source: "sport_default_auto",
            ruleConfig,
          },
          templateVersion: templateVersion ?? prev.ruleConfig.templateVersion,
        },
      }));
    },
    [],
  );

  const updateCategories = useCallback((categories: WizardDraft["categories"]) => {
    setDraft((prev) => ({ ...prev, categories }));
  }, []);

  const updateRegistration = useCallback((registration: WizardDraft["registration"]) => {
    setDraft((prev) => ({ ...prev, registration }));
  }, []);

  const updateFormatRules = useCallback((formatRules: WizardDraft["formatRules"]) => {
    setDraft((prev) => ({ ...prev, formatRules }));
  }, []);

  const updateRuleConfig = useCallback((ruleConfig: WizardDraft["ruleConfig"]) => {
    setDraft((prev) => ({ ...prev, ruleConfig }));
  }, []);

  const saveDraft = useCallback(async () => {
    setSaveState("saving");
    const result = await saveTournamentDraftAction(draft);
    if (result.ok) {
      setDraft((prev) => ({ ...prev, draftId: result.draftId }));
      setSaveState("saved");
    } else {
      setSaveState("error");
    }
    return result;
  }, [draft]);

  const publish = useCallback(async () => {
    const result = await publishTournamentAction(draft);
    if (result.ok) {
      return {
        ok: true as const,
        tournamentId: result.tournamentId,
        slug: result.slug,
      };
    }
    return { ok: false as const, error: result.error };
  }, [draft]);

  return {
    draft,
    setDraft,
    currentStep,
    setCurrentStep: goToStep,
    stepIndex,
    stepOrder: WIZARD_STEP_ORDER,
    canGoNext,
    canGoPrev: !!prevStepId,
    goNext,
    goPrev,
    updateBasics,
    updateCategories,
    updateRegistration,
    updateFormatRules,
    updateRuleConfig,
    applySportRuleTemplate,
    saveState,
    saveDraft,
    publish,
  };
}
