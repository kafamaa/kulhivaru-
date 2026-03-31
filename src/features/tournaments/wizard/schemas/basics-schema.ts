import { z } from "zod";

export const basicsSchema = z
  .object({
    tournamentName: z.string().min(3, "Name must be at least 3 characters"),
    shortName: z.string().max(30).optional(),
    sport: z.string().min(1, "Select a sport"),
    description: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    registrationOpen: z.string().optional(),
    registrationClose: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    venueName: z.string().optional(),
    venueNotes: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal("")),
    bannerUrl: z.string().url().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.endDate) >= new Date(data.startDate);
    },
    { message: "End date must be on or after start date", path: ["endDate"] }
  );

export type BasicsSchemaInput = z.infer<typeof basicsSchema>;
