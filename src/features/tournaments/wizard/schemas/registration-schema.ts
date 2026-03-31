import { z } from "zod";

export const approvalModeSchema = z.enum(["manual", "auto", "payment_first"]);

export const registrationSchema = z.object({
  approvalMode: approvalModeSchema.default("manual"),
  entryFee: z.string().optional(),
  currency: z.string().length(3).optional().or(z.literal("")),
  paymentRequiredBeforeApproval: z.boolean().default(false),
  allowWaitlist: z.boolean().default(false),
  requireTeamLogo: z.boolean().default(false),
  requireManagerContact: z.boolean().default(true),
  requirePlayerList: z.boolean().default(false),
  requireIdVerification: z.boolean().default(false),
  requirePaymentReceipt: z.boolean().default(false),
  instructions: z.string().optional(),
  refundPolicy: z.string().optional(),
  eligibilityNotes: z.string().optional(),
});

export type RegistrationSchemaInput = z.infer<typeof registrationSchema>;
