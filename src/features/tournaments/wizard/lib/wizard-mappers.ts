import type { WizardDraft, WizardBasics, WizardCategory } from "../types";

/**
 * Map wizard draft to payload for save-draft RPC.
 * Backend RPC signature is assumed; adjust keys to match your API.
 */
export function draftToSavePayload(draft: WizardDraft): Record<string, unknown> {
  return {
    draft_id: draft.draftId ?? undefined,
    organization_id: draft.organizationId ?? undefined,
    basics: draft.basics,
    categories: draft.categories,
    registration: draft.registration,
    format_rules: draft.formatRules,
    tournament_rule_config: {
      sport: draft.ruleConfig.tournament.sport,
      source: draft.ruleConfig.tournament.source,
      rule_config: draft.ruleConfig.tournament.ruleConfig,
    },
    category_rule_configs: draft.ruleConfig.categories.map((c) => ({
      categoryId: c.categoryId,
      rule_config: c.ruleConfig,
    })),
    phase_rule_configs: draft.ruleConfig.phases.map((p) => ({
      phaseKey: p.phaseKey,
      rule_config: p.ruleConfig,
    })),
  };
}

/**
 * Map API response (or stored draft) back to WizardDraft.
 */
export function payloadToDraft(payload: Record<string, unknown>): Partial<WizardDraft> {
  return {
    draftId:
      typeof payload.draft_id === "string" ? payload.draft_id : undefined,
    organizationId:
      typeof payload.organization_id === "string"
        ? payload.organization_id
        : undefined,
    basics:
      payload.basics && typeof payload.basics === "object"
        ? (payload.basics as WizardBasics)
        : undefined,
    categories: Array.isArray(payload.categories)
      ? (payload.categories as WizardCategory[])
      : undefined,
    registration:
      payload.registration && typeof payload.registration === "object"
        ? payload.registration as WizardDraft["registration"]
        : undefined,
    formatRules: Array.isArray(payload.format_rules)
      ? (payload.format_rules as WizardDraft["formatRules"])
      : undefined,
    ruleConfig:
      payload.tournament_rule_config && typeof payload.tournament_rule_config === "object"
        ? ({
            tournament: {
              sport: String(
                (payload.tournament_rule_config as { sport?: string }).sport ?? "Football"
              ),
              source: String(
                (payload.tournament_rule_config as { source?: string }).source ??
                  "organizer_wizard"
              ),
              ruleConfig:
                ((payload.tournament_rule_config as { rule_config?: Record<string, unknown> })
                  .rule_config as Record<string, unknown>) ?? {},
            },
            categories: Array.isArray(payload.category_rule_configs)
              ? (payload.category_rule_configs as Array<Record<string, unknown>>).map((c) => ({
                  categoryId: String(c.categoryId ?? ""),
                  ruleConfig: (c.rule_config as Record<string, unknown>) ?? {},
                }))
              : [],
            phases: Array.isArray(payload.phase_rule_configs)
              ? (payload.phase_rule_configs as Array<Record<string, unknown>>).map((p) => ({
                  phaseKey: String(p.phaseKey ?? "default"),
                  ruleConfig: (p.rule_config as Record<string, unknown>) ?? {},
                }))
              : [],
          } as WizardDraft["ruleConfig"])
        : undefined,
  };
}
