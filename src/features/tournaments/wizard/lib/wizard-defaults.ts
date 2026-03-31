import type {
  WizardBasics,
  WizardCategory,
  WizardRegistration,
  WizardFormatRules,
  WizardDraft,
  WizardRuleConfig,
} from "../types";
import { getSportRulePreset } from "@/src/features/rules/sport-rule-presets";

const today = () => new Date().toISOString().slice(0, 10);
const nextMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
};

export function getSportCategoryDefaults(sport: string): Pick<
  WizardCategory,
  "rosterMin" | "rosterMax" | "matchDurationMinutes"
> {
  const s = sport.trim().toLowerCase();
  if (s === "futsal") return { rosterMin: 8, rosterMax: 14, matchDurationMinutes: 40 };
  if (s === "basketball") return { rosterMin: 8, rosterMax: 12, matchDurationMinutes: 40 };
  if (s === "volleyball") return { rosterMin: 8, rosterMax: 14, matchDurationMinutes: 60 };
  if (s === "badminton") return { rosterMin: 1, rosterMax: 2, matchDurationMinutes: 45 };
  return { rosterMin: 11, rosterMax: 20, matchDurationMinutes: 90 };
}

export function getSportFormatDefaults(sport: string): Pick<
  WizardFormatRules,
  "matchDurationMinutes" | "breakDurationMinutes"
> {
  const s = sport.trim().toLowerCase();
  if (s === "futsal") return { matchDurationMinutes: 40, breakDurationMinutes: 10 };
  if (s === "basketball") return { matchDurationMinutes: 40, breakDurationMinutes: 10 };
  if (s === "volleyball") return { matchDurationMinutes: 60, breakDurationMinutes: 10 };
  if (s === "badminton") return { matchDurationMinutes: 45, breakDurationMinutes: 5 };
  return { matchDurationMinutes: 90, breakDurationMinutes: 15 };
}

export function getDefaultBasics(): WizardBasics {
  return {
    tournamentName: "",
    shortName: "",
    sport: "Football",
    description: "",
    startDate: today(),
    endDate: nextMonth(),
    registrationOpen: today(),
    registrationClose: nextMonth(),
    country: "",
    city: "",
    venueName: "",
    venueNotes: "",
    logoUrl: "",
    bannerUrl: "",
  };
}

export function getDefaultCategory(sortOrder: number, sport = "Football"): WizardCategory {
  const sportDefaults = getSportCategoryDefaults(sport);
  return {
    id: crypto.randomUUID(),
    name: "",
    shortLabel: "",
    genderGroup: "open",
    ageGroup: "",
    maxTeams: 16,
    minTeams: 4,
    rosterMin: sportDefaults.rosterMin,
    rosterMax: sportDefaults.rosterMax,
    matchDurationMinutes: sportDefaults.matchDurationMinutes,
    visibility: "public",
    sortOrder,
  };
}

export function getDefaultRegistration(): WizardRegistration {
  return {
    approvalMode: "manual",
    entryFee: "",
    currency: "USD",
    paymentRequiredBeforeApproval: false,
    allowWaitlist: false,
    requireTeamLogo: false,
    requireManagerContact: true,
    requirePlayerList: false,
    requireIdVerification: false,
    requirePaymentReceipt: false,
    instructions: "",
    refundPolicy: "",
    eligibilityNotes: "",
  };
}

export function getDefaultFormatRules(categoryId: string, sport = "Football"): WizardFormatRules {
  const sportDefaults = getSportFormatDefaults(sport);
  return {
    categoryId,
    formatType: "round_robin",
    groupCount: 2,
    teamsAdvancePerGroup: 2,
    includeBestRunnersUp: 0,
    knockoutRound: "semifinal",
    roundRobinLegs: 1,
    thirdPlaceMatch: true,
    tiebreakOrder: [],
    autoGenerateFixtures: true,
    matchDurationMinutes: sportDefaults.matchDurationMinutes,
    breakDurationMinutes: sportDefaults.breakDurationMinutes,
    preferredStartTime: "09:00",
    preferredEndTime: "18:00",
    maxMatchesPerDayPerTeam: 1,
    minRestMinutesBetweenMatches: 0,
  };
}

export function getEmptyDraft(organizationId?: string | null): WizardDraft {
  const sportPreset = getSportRulePreset("Football");
  const ruleConfig: WizardRuleConfig = {
    tournament: {
      sport: sportPreset.sport,
      source: "sport_default_auto",
      ruleConfig: { ...sportPreset.ruleConfig },
    },
    categories: [],
    phases: [],
    templateVersion: sportPreset.version,
  };

  return {
    basics: getDefaultBasics(),
    categories: [],
    registration: getDefaultRegistration(),
    formatRules: [],
    ruleConfig,
    draftId: null,
    organizationId: organizationId ?? null,
  };
}
