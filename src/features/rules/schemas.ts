import { z } from "zod";

export const tournamentRuleConfigSchema = z.object({
  sport: z.string().min(1),
  source: z.string().optional(),
  ruleConfig: z.record(z.any()),
});

export const categoryRuleConfigSchema = z.object({
  categoryId: z.string().uuid(),
  ruleConfig: z.record(z.any()),
});

export const phaseRuleConfigSchema = z.object({
  phaseKey: z.string().min(1),
  ruleConfig: z.record(z.any()),
});

export const wizardRuleConfigSchema = z.object({
  tournament: tournamentRuleConfigSchema,
  categories: z.array(categoryRuleConfigSchema).default([]),
  phases: z.array(phaseRuleConfigSchema).default([]),
});
