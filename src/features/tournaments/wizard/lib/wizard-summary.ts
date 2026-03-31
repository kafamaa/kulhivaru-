import type { WizardDraft, WizardReviewState } from "../types";

export function deriveWizardSummary(draft: WizardDraft): {
  name: string;
  sport: string;
  dateRange: string;
  categoryCount: number;
  registrationSummary: string;
  formatSummary: string;
} {
  const start = draft.basics.startDate
    ? new Date(draft.basics.startDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  const end = draft.basics.endDate
    ? new Date(draft.basics.endDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  const dateRange = start === end ? start : `${start} – ${end}`;

  let registrationSummary = "Manual approval";
  if (draft.registration.approvalMode === "auto") registrationSummary = "Auto-approve";
  else if (draft.registration.approvalMode === "payment_first")
    registrationSummary = "Payment required first";
  if (draft.registration.entryFee && Number(draft.registration.entryFee) > 0)
    registrationSummary += ` · ${draft.registration.currency} ${draft.registration.entryFee}`;

  const formatLabels = draft.formatRules.map((f) => {
    const cat = draft.categories.find((c) => c.id === f.categoryId);
    const catName = cat?.name ?? "Category";
    if (f.formatType === "round_robin") return `${catName}: Round robin`;
    if (f.formatType === "groups_knockout")
      return `${catName}: Groups + knockout`;
    if (f.formatType === "knockout_only") return `${catName}: Knockout`;
    return `${catName}: Custom`;
  });
  const formatSummary = formatLabels.length > 0 ? formatLabels.join(" · ") : "Not set";

  return {
    name: draft.basics.tournamentName || "Untitled tournament",
    sport: draft.basics.sport || "—",
    dateRange,
    categoryCount: draft.categories.length,
    registrationSummary,
    formatSummary,
  };
}

export function deriveWarningsAndBlockers(draft: WizardDraft): WizardReviewState {
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (!draft.basics.tournamentName.trim())
    blockers.push("Tournament name is required.");
  if (draft.basics.tournamentName.length < 3)
    blockers.push("Tournament name must be at least 3 characters.");
  if (!draft.basics.sport) blockers.push("Sport is required.");
  if (!draft.basics.startDate) blockers.push("Start date is required.");
  if (!draft.basics.endDate) blockers.push("End date is required.");
  if (
    draft.basics.startDate &&
    draft.basics.endDate &&
    new Date(draft.basics.endDate) < new Date(draft.basics.startDate)
  )
    blockers.push("End date must be on or after start date.");

  if (draft.categories.length === 0)
    blockers.push("Add at least one category.");
  draft.categories.forEach((c, i) => {
    if (!c.name.trim()) blockers.push(`Category ${i + 1}: name is required.`);
    if (c.rosterMax < c.rosterMin)
      warnings.push(`Category "${c.name}": roster max should be ≥ min.`);
  });

  if (
    draft.registration.approvalMode === "payment_first" &&
    (!draft.registration.entryFee || Number(draft.registration.entryFee) <= 0)
  )
    warnings.push("Payment-first approval is set but no entry fee.");

  if (draft.formatRules.length < draft.categories.length)
    warnings.push("Some categories have no format configured.");

  return { warnings, blockers };
}
