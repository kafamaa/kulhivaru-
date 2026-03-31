import { z } from "zod";

export const organizationSettingsSchema = z.object({
  name: z.string().min(2, "Name is too short").max(80, "Name is too long"),
  slug: z
    .string()
    .min(2, "Slug is too short")
    .max(60, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
});

export type OrganizationSettingsFormValues = z.infer<
  typeof organizationSettingsSchema
>;

