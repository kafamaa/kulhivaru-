"use client";

import { useState } from "react";
import type { WizardDraft } from "../types";
import { deriveWizardSummary, deriveWarningsAndBlockers } from "../lib/wizard-summary";
import { canProceedFromStep } from "../lib/wizard-steps";
import { ReviewSummaryCard } from "../components/review-summary-card";
import { PublishChecklist } from "../components/publish-checklist";
import { PublishConfirmationDialog } from "../components/publish-confirmation-dialog";

const WIZARD_STEP_ORDER = ["basics", "categories", "registration", "format", "review"] as const;

interface ReviewPublishStepProps {
  draft: WizardDraft;
  onPublish: () => Promise<{ ok: boolean; error?: string; tournamentId?: string }>;
  publishHref: (tournamentId: string) => string;
  publishDialogOpen?: boolean;
  onOpenPublishDialog?: (open: boolean) => void;
  onClosePublishDialog?: () => void;
}

export function ReviewPublishStep({
  draft,
  onPublish,
  publishHref,
  publishDialogOpen = false,
  onOpenPublishDialog,
  onClosePublishDialog,
}: ReviewPublishStepProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const isOpen = publishDialogOpen ?? dialogOpen;
  const setOpen = onOpenPublishDialog ?? setDialogOpen;
  const onClose = onClosePublishDialog ?? (() => setDialogOpen(false));

  const summary = deriveWizardSummary(draft);
  const review = deriveWarningsAndBlockers(draft);
  const stepsComplete = Object.fromEntries(
    WIZARD_STEP_ORDER.map((step) => [step, canProceedFromStep(step, draft)])
  );

  const handleConfirmPublish = async () => {
    setPublishError(null);
    setIsPublishing(true);
    const result = await onPublish();
    setIsPublishing(false);
    if (result.ok) {
      setOpen(false);
      onClose();
      const id = "tournamentId" in result ? (result as { tournamentId: string }).tournamentId : "";
      const href = publishHref(id);
      if (href) window.location.href = href;
    } else {
      setPublishError(result.error ?? "Publish failed");
    }
  };

  return (
    <div className="space-y-6">
      <ReviewSummaryCard
        title="Basics"
        stepId="basics"
        editHref="/organizer/tournaments/new?step=basics"
        complete={stepsComplete.basics}
      >
        <p>{summary.name}</p>
        <p className="mt-1">{summary.sport} · {summary.dateRange}</p>
      </ReviewSummaryCard>
      <ReviewSummaryCard
        title="Categories"
        stepId="categories"
        editHref="/organizer/tournaments/new?step=categories"
        complete={stepsComplete.categories}
      >
        <p>{summary.categoryCount} categor{summary.categoryCount === 1 ? "y" : "ies"}</p>
      </ReviewSummaryCard>
      <ReviewSummaryCard
        title="Registration"
        stepId="registration"
        editHref="/organizer/tournaments/new?step=registration"
        complete={true}
      >
        <p>{summary.registrationSummary}</p>
      </ReviewSummaryCard>
      <ReviewSummaryCard
        title="Format & Rules"
        stepId="format"
        editHref="/organizer/tournaments/new?step=format"
        complete={stepsComplete.format}
      >
        <p className="line-clamp-2">{summary.formatSummary}</p>
      </ReviewSummaryCard>
      <PublishChecklist review={review} stepsComplete={stepsComplete} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
      >
        Publish tournament
      </button>
      <PublishConfirmationDialog
        open={isOpen}
        tournamentName={draft.basics.tournamentName}
        onConfirm={handleConfirmPublish}
        onCancel={() => {
          setOpen(false);
          onClose();
          setPublishError(null);
        }}
        isPublishing={isPublishing}
        error={publishError}
      />
    </div>
  );
}
