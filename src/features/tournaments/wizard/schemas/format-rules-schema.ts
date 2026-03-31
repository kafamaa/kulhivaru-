import { z } from "zod";

export const formatTypeSchema = z.enum([
  "round_robin",
  "groups_knockout",
  "knockout_only",
  "custom",
]);

export const tiebreakRuleSchema = z.object({
  key: z.string(),
  label: z.string(),
  order: z.number().int().min(0),
});

export const formatRulesSchema = z.object({
  categoryId: z.string(),
  formatType: formatTypeSchema.default("round_robin"),
  groupCount: z.coerce.number().min(1).max(32),
  teamsAdvancePerGroup: z.coerce.number().min(1).max(16),
  includeBestRunnersUp: z.coerce.number().int().min(0).max(8),
  knockoutRound: z.string().optional(),
  roundRobinLegs: z.coerce.number().int().min(1).max(4),
  thirdPlaceMatch: z.boolean().default(true),
  tiebreakOrder: z.array(tiebreakRuleSchema).default([]),
  autoGenerateFixtures: z.boolean().default(true),
  matchDurationMinutes: z.coerce.number().min(5).max(180),
  breakDurationMinutes: z.coerce.number().min(0).max(60),
  preferredStartTime: z.string().optional(),
  preferredEndTime: z.string().optional(),
  maxMatchesPerDayPerTeam: z.coerce.number().min(1).max(4),
  minRestMinutesBetweenMatches: z.coerce.number().min(0).max(1440),
});

export type FormatRulesSchemaInput = z.infer<typeof formatRulesSchema>;
