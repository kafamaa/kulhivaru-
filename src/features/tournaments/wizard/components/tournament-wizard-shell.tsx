"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTournamentWizard } from "../hooks/use-tournament-wizard";
import { WizardHeader } from "./wizard-header";
import { WizardStepper } from "./wizard-stepper";
import { WizardSummarySidebar } from "./wizard-summary-sidebar";
import { WizardFooterBar } from "./wizard-footer-bar";
import { BasicsStepForm } from "../steps/basics-step-form";
import { CategoriesStepForm } from "../steps/categories-step-form";
import { RegistrationStepForm } from "../steps/registration-step-form";
import { FormatRulesStepForm } from "../steps/format-rules-step-form";
import { ReviewPublishStep } from "../steps/review-publish-step";
import { getSportRuleTemplateAction } from "@/src/features/rules/actions/rule-config-actions";

interface TournamentWizardShellProps {
  organizationId?: string | null;
  organizationName?: string | null;
  initialDraft?: Partial<import("../types").WizardDraft> | null;
  initialStep?: import("../types").WizardStepId | null;
}

export function TournamentWizardShell({
  organizationId = null,
  organizationName = null,
  initialDraft = null,
  initialStep = null,
}: TournamentWizardShellProps) {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [sportRulesNotice, setSportRulesNotice] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    draft,
    currentStep,
    setCurrentStep,
    stepOrder,
    canGoNext,
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
  } = useTournamentWizard({ initialDraft, organizationId });

  // Initialize from URL (?step=...) or prop
  useEffect(() => {
    const stepFromUrl = searchParams.get("step") as any;
    const step = (stepFromUrl || initialStep) as any;
    if (step && ["basics", "categories", "registration", "format", "review"].includes(step)) {
      setCurrentStep(step);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPublishStep = currentStep === "review";
  const canNavigateToStep = (step: string) => {
    const idx = stepOrder.indexOf(step as (typeof stepOrder)[number]);
    const currentIdx = stepOrder.indexOf(currentStep);
    return idx <= currentIdx || step === "review";
  };

  // Keep URL in sync across steps (so refresh/back works and links keep org)
  const orgParam = organizationId ?? searchParams.get("org");
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", currentStep);
    if (orgParam) params.set("org", orgParam);
    router.replace(`/organizer/tournaments/new?${params.toString()}`);
  }, [currentStep, orgParam, router, searchParams]);

  const handlePublishClick = () => {
    if (isPublishStep) setPublishDialogOpen(true);
  };

  const handleSportSelected = async (sport: string) => {
    const currentSport = draft.ruleConfig.tournament.sport;
    if (sport === currentSport) return;
    const res = await getSportRuleTemplateAction(sport);
    if (!res.ok) return;
    applySportRuleTemplate(sport, res.data.ruleConfig as Record<string, unknown>, res.data.version);
    setSportRulesNotice(`Default rules loaded for ${sport}.`);
  };

  const handleResetSportRules = async () => {
    const sport = draft.basics.sport;
    const res = await getSportRuleTemplateAction(sport);
    if (!res.ok) return;
    applySportRuleTemplate(sport, res.data.ruleConfig as Record<string, unknown>, res.data.version);
    setSportRulesNotice(`Default rules loaded for ${sport}.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <WizardHeader
        saveState={saveState}
        onSaveDraft={saveDraft}
        isSaving={saveState === "saving"}
        organizationName={organizationName}
        organizationId={organizationId}
      />
      <WizardStepper
        currentStep={currentStep}
        stepOrder={stepOrder}
        onStepClick={setCurrentStep}
        canNavigateToStep={canNavigateToStep}
      />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            {currentStep === "basics" && (
              <BasicsStepForm
                data={draft.basics}
                onChange={updateBasics}
                onSportSelected={handleSportSelected}
                sportRulesNotice={sportRulesNotice}
              />
            )}
            {currentStep === "categories" && (
              <CategoriesStepForm draft={draft} onChange={updateCategories} />
            )}
            {currentStep === "registration" && (
              <RegistrationStepForm
                data={draft.registration}
                onChange={updateRegistration}
              />
            )}
            {currentStep === "format" && (
              <FormatRulesStepForm
                draft={draft}
                onChange={updateFormatRules}
                onRuleConfigChange={updateRuleConfig}
                onResetSportRules={handleResetSportRules}
              />
            )}
            {currentStep === "review" && (
              <ReviewPublishStep
                draft={draft}
                onPublish={publish}
                publishHref={(id) => (id ? `/organizer/t/${id}` : "/organizer/tournaments")}
                publishDialogOpen={publishDialogOpen}
                onOpenPublishDialog={setPublishDialogOpen}
                onClosePublishDialog={() => setPublishDialogOpen(false)}
              />
            )}
          </div>
          <div className="hidden lg:block">
            <WizardSummarySidebar draft={draft} />
          </div>
        </div>
      </div>
      <WizardFooterBar
        currentStep={currentStep}
        canGoNext={canGoNext}
        canGoPrev={stepOrder.indexOf(currentStep) > 0}
        onNext={goNext}
        onPrev={goPrev}
        onPublish={isPublishStep ? handlePublishClick : undefined}
        isPublishStep={isPublishStep}
      />
    </div>
  );
}
