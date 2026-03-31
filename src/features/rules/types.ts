import type { Json } from "@/src/types/database";

export type SupportedSport =
  | "Football"
  | "Futsal"
  | "Basketball"
  | "Volleyball"
  | "Badminton";

export type RuleEventType =
  | "goal"
  | "assist"
  | "yellow_card"
  | "red_card"
  | "sub_in"
  | "sub_out"
  | "team_foul"
  | "penalty_free_kick";

export interface SportRuleTemplate {
  sport: SupportedSport;
  displayName: string;
  version: number;
  ruleConfig: Record<string, Json>;
}

export interface TournamentRuleConfigInput {
  sport: SupportedSport | string;
  source?: string;
  ruleConfig: Record<string, Json>;
}

export interface CategoryRuleConfigInput {
  categoryId: string;
  ruleConfig: Record<string, Json>;
}

export interface PhaseRuleConfigInput {
  phaseKey: string;
  ruleConfig: Record<string, Json>;
}

export interface WizardRuleConfigState {
  tournament: TournamentRuleConfigInput;
  categories: CategoryRuleConfigInput[];
  phases: PhaseRuleConfigInput[];
}
