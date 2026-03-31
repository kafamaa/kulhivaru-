"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { ActionResult } from "@/src/features/matches/organizer/actions/match-actions";

function moneyToNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

const INCOME_TYPES = ["sponsorship", "ticket_sales", "merchandise", "broadcast", "misc"] as const;

const createIncomeSchema = z.object({
  tournamentId: z.string().uuid(),
  incomeType: z.enum(INCOME_TYPES),
  sourceName: z.string().trim().max(200).optional(),
  amount: z.string().min(1, "Amount is required"),
  reference: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;

export async function createIncomeAction(input: CreateIncomeInput): Promise<ActionResult> {
  const parsed = createIncomeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const { tournamentId, incomeType, sourceName, amount, reference, notes } = parsed.data;
  const amountNum = moneyToNumber(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { ok: false, error: "Amount must be greater than 0." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("finance_income").insert({
    tournament_id: tournamentId,
    income_type: incomeType,
    source_name: sourceName?.trim() || null,
    amount: amountNum,
    reference: reference?.trim() || null,
    notes: notes?.trim() || null,
    status: "posted",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/organizer/t/${tournamentId}/finance`);
  return { ok: true };
}
