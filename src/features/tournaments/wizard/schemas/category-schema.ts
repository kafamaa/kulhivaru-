import { z } from "zod";

export const genderGroupSchema = z.enum(["open", "men", "women", "mixed", ""]);
export const visibilitySchema = z.enum(["public", "hidden", "invite_only"]);

export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Category name is required"),
  shortLabel: z.string().max(20).optional(),
  genderGroup: genderGroupSchema.default("open"),
  ageGroup: z.string().optional(),
  maxTeams: z.coerce.number().min(2).max(256),
  minTeams: z.coerce.number().min(2).max(256),
  rosterMin: z.coerce.number().min(1).max(100),
  rosterMax: z.coerce.number().min(1).max(100),
  matchDurationMinutes: z.coerce.number().min(5).max(180),
  visibility: visibilitySchema.default("public"),
  sortOrder: z.coerce.number().int().min(0),
});

export type CategorySchemaInput = z.infer<typeof categorySchema>;
