/**
 * Tournament wizard draft shape — client-side only.
 * Persisted via save-draft RPC; final publish maps to DB schema.
 */

export type WizardStepId = "basics" | "categories" | "registration" | "format" | "review";

export interface WizardBasics {
  tournamentName: string;
  shortName: string;
  sport: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationOpen: string;
  registrationClose: string;
  country: string;
  city: string;
  venueName: string;
  venueNotes: string;
  logoUrl: string;
  bannerUrl: string;
}

export type GenderGroup = "open" | "men" | "women" | "mixed" | "";
export type CategoryVisibility = "public" | "hidden" | "invite_only";

export interface WizardCategory {
  id: string;
  name: string;
  shortLabel: string;
  genderGroup: GenderGroup;
  ageGroup: string;
  maxTeams: number;
  minTeams: number;
  rosterMin: number;
  rosterMax: number;
  matchDurationMinutes: number;
  visibility: CategoryVisibility;
  sortOrder: number;
}

export type ApprovalMode = "manual" | "auto" | "payment_first";

export interface WizardRegistration {
  approvalMode: ApprovalMode;
  entryFee: string;
  currency: string;
  paymentRequiredBeforeApproval: boolean;
  allowWaitlist: boolean;
  requireTeamLogo: boolean;
  requireManagerContact: boolean;
  requirePlayerList: boolean;
  requireIdVerification: boolean;
  requirePaymentReceipt: boolean;
  instructions: string;
  refundPolicy: string;
  eligibilityNotes: string;
}

export type FormatType = "round_robin" | "groups_knockout" | "knockout_only" | "custom";

export interface TiebreakRule {
  key: string;
  label: string;
  order: number;
}

export interface WizardFormatRules {
  categoryId: string;
  formatType: FormatType;
  groupCount: number;
  teamsAdvancePerGroup: number;
  includeBestRunnersUp: number;
  knockoutRound: string;
  roundRobinLegs: number;
  thirdPlaceMatch: boolean;
  tiebreakOrder: TiebreakRule[];
  autoGenerateFixtures: boolean;
  matchDurationMinutes: number;
  breakDurationMinutes: number;
  preferredStartTime: string;
  preferredEndTime: string;
  maxMatchesPerDayPerTeam: number;
  minRestMinutesBetweenMatches: number;
}

export interface WizardTournamentRuleConfig {
  sport: string;
  source: string;
  ruleConfig: Record<string, unknown>;
}

export interface WizardCategoryRuleConfig {
  categoryId: string;
  ruleConfig: Record<string, unknown>;
}

export interface WizardPhaseRuleConfig {
  phaseKey: string;
  ruleConfig: Record<string, unknown>;
}

export interface WizardRuleConfig {
  tournament: WizardTournamentRuleConfig;
  categories: WizardCategoryRuleConfig[];
  phases: WizardPhaseRuleConfig[];
  templateVersion?: number;
}

export interface WizardDraft {
  basics: WizardBasics;
  categories: WizardCategory[];
  registration: WizardRegistration;
  formatRules: WizardFormatRules[];
  ruleConfig: WizardRuleConfig;
  draftId?: string | null;
  organizationId?: string | null;
}

export interface WizardReviewState {
  warnings: string[];
  blockers: string[];
}

export type SaveState = "idle" | "saving" | "saved" | "error";

export const WIZARD_STEP_ORDER: WizardStepId[] = [
  "basics",
  "categories",
  "registration",
  "format",
  "review",
];

export const STEP_LABELS: Record<WizardStepId, string> = {
  basics: "Basics",
  categories: "Categories",
  registration: "Registration",
  format: "Format & Rules",
  review: "Review & Publish",
};
