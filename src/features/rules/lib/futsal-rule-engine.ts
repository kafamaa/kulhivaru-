export interface FutsalRuleConfig {
  team_foul_limit_per_half?: number;
  penalty_after_foul_limit?: boolean;
}

export function shouldTriggerFutsalPenaltyFromFoul(input: {
  foulsInHalfForTeam: number;
  config: FutsalRuleConfig;
}): boolean {
  const limit = Number(input.config.team_foul_limit_per_half ?? 5);
  const enabled = Boolean(input.config.penalty_after_foul_limit ?? true);
  return enabled && input.foulsInHalfForTeam > limit;
}
