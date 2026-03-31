import type { Json } from "@/src/types/database";
import type { SportRuleTemplate, SupportedSport } from "./types";

const PRESETS: Record<SupportedSport, SportRuleTemplate> = {
  Football: {
    sport: "Football",
    displayName: "Football",
    version: 1,
    ruleConfig: {
      match_format: {
        players_on_court: 11,
        halves: 2,
        half_duration_minutes: 45,
      } as Json,
      scoring_model: { goal_points: 1 } as Json,
      foul_card_model: {
        yellow_red_cards_enabled: true,
      } as Json,
      overtime_rules: {
        extra_time_enabled: true,
        extra_time_halves: 2,
        extra_time_half_minutes: 15,
      } as Json,
      penalty_shootout_rules: {
        penalties_enabled: true,
        initial_kicks: 5,
      } as Json,
      event_types: ["goal", "assist", "yellow_card", "red_card", "sub_in", "sub_out"] as Json,
    },
  },
  Futsal: {
    sport: "Futsal",
    displayName: "Futsal",
    version: 1,
    ruleConfig: {
      players_on_court: 5,
      halves: 2,
      half_duration_minutes: 20,
      rolling_substitutions: true,
      yellow_red_cards_enabled: true,
      team_foul_limit_per_half: 5,
      penalty_after_foul_limit: true,
      reset_fouls_each_half: true,
      extra_time_enabled: false,
      penalties_enabled: true,
      scoring_model: { goal_points: 1 } as Json,
      event_types: [
        "goal",
        "assist",
        "yellow_card",
        "red_card",
        "sub_in",
        "sub_out",
        "team_foul",
        "penalty_free_kick",
      ] as Json,
    },
  },
  Basketball: {
    sport: "Basketball",
    displayName: "Basketball",
    version: 1,
    ruleConfig: {
      match_format: {
        players_on_court: 5,
        periods: 4,
        period_duration_minutes: 10,
      } as Json,
      scoring_model: {
        two_point: 2,
        three_point: 3,
        free_throw: 1,
      } as Json,
      event_types: ["goal", "assist", "sub_in", "sub_out"] as Json,
    },
  },
  Volleyball: {
    sport: "Volleyball",
    displayName: "Volleyball",
    version: 1,
    ruleConfig: {
      match_format: {
        players_on_court: 6,
        sets_to_win: 3,
        best_of_sets: 5,
      } as Json,
      scoring_model: {
        rally_point: true,
        set_points: 25,
      } as Json,
      event_types: ["sub_in", "sub_out"] as Json,
    },
  },
  Badminton: {
    sport: "Badminton",
    displayName: "Badminton",
    version: 1,
    ruleConfig: {
      match_format: {
        games_to_win: 2,
        best_of_games: 3,
      } as Json,
      scoring_model: {
        rally_point: true,
        points_per_game: 21,
      } as Json,
      event_types: ["sub_in", "sub_out"] as Json,
    },
  },
};

export function getSportRulePreset(sport: string): SportRuleTemplate {
  const normalized = sport.trim().toLowerCase();
  const found = (Object.values(PRESETS) as SportRuleTemplate[]).find(
    (p) => p.sport.toLowerCase() === normalized,
  );
  return found ?? PRESETS.Football;
}
