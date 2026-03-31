import { z } from "zod";

export const TOURNAMENT_STATUSES = [
  "draft",
  "upcoming",
  "ongoing",
  "completed",
  "archived",
] as const;

export const tournamentSettingsSchema = z
  .object({
    name: z.string().min(2, "Name is too short").max(80, "Name is too long"),
    sport: z.string().min(2, "Sport is required").max(50),
    location: z.string().trim().max(120).nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    coverImageUrl: z.string().url("Cover image must be a URL").nullable().optional(),
    logoUrl: z.string().url("Logo must be a URL").nullable().optional(),
    status: z.enum(TOURNAMENT_STATUSES),
    isRegistrationOpen: z.boolean(),
  })
  .refine(
    (v) => {
      if (!v.startDate || !v.endDate) return true;
      return new Date(v.endDate) >= new Date(v.startDate);
    },
    { path: ["endDate"], message: "End date must be after start date" }
  );

export type TournamentSettingsFormValues = z.infer<
  typeof tournamentSettingsSchema
>;

