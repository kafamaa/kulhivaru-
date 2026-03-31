"use server";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { getSportRulePreset } from "../sport-rule-presets";
import type {
  CategoryRuleConfigInput,
  PhaseRuleConfigInput,
  TournamentRuleConfigInput,
} from "../types";

export async function getSportRuleTemplateAction(sport: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("rpc_get_sport_rule_template", {
    p_sport: sport,
  });

  if (error) {
    return {
      ok: true as const,
      data: getSportRulePreset(sport),
    };
  }

  if (!data || typeof data !== "object") {
    return { ok: true as const, data: getSportRulePreset(sport) };
  }

  return {
    ok: true as const,
    data: {
      sport: String((data as { sport?: string }).sport ?? sport),
      displayName: String((data as { display_name?: string }).display_name ?? sport),
      version: Number((data as { version?: number }).version ?? 1),
      ruleConfig: ((data as { rule_config?: Record<string, unknown> }).rule_config ??
        {}) as Record<string, unknown>,
    },
  };
}

export async function setTournamentRuleConfigAction(input: {
  tournamentId: string;
  config: TournamentRuleConfigInput;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("rpc_set_tournament_rule_config", {
    p_tournament_id: input.tournamentId,
    p_sport: input.config.sport,
    p_rule_config: input.config.ruleConfig,
    p_source: input.config.source ?? "organizer_wizard",
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data };
}

export async function setCategoryRuleConfigAction(input: {
  tournamentId: string;
  config: CategoryRuleConfigInput;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("rpc_set_category_rule_config", {
    p_tournament_id: input.tournamentId,
    p_category_id: input.config.categoryId,
    p_rule_config: input.config.ruleConfig,
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data };
}

export async function setPhaseRuleConfigAction(input: {
  tournamentId: string;
  config: PhaseRuleConfigInput;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("rpc_set_phase_rule_config", {
    p_tournament_id: input.tournamentId,
    p_phase_key: input.config.phaseKey,
    p_rule_config: input.config.ruleConfig,
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data };
}

export async function resetTournamentRuleConfigToDefaultAction(input: {
  tournamentId: string;
  sport: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "rpc_reset_tournament_rule_config_to_sport_default",
    {
      p_tournament_id: input.tournamentId,
      p_sport: input.sport,
    },
  );
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data };
}
