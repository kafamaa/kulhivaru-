"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { ActionResult } from "@/src/features/matches/organizer/actions/match-actions";

const SUPPORTED_CURRENCIES = ["USD", "MVR"] as const;

const updateFinanceSettingsSchema = z.object({
  tournamentId: z.string().uuid(),
  currency: z.enum(SUPPORTED_CURRENCIES),
});

export type UpdateFinanceSettingsInput = z.infer<typeof updateFinanceSettingsSchema>;

export async function updateFinanceSettingsAction(
  input: UpdateFinanceSettingsInput
): Promise<ActionResult> {
  const parsed = updateFinanceSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid currency." };

  const { tournamentId, currency } = parsed.data;

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("tournament_finance_settings")
    .upsert(
      {
        tournament_id: tournamentId,
        currency,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tournament_id" }
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/organizer/t/${tournamentId}/finance`);
  return { ok: true };
}
