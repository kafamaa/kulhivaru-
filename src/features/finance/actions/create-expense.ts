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

const createExpenseSchema = z.object({
  tournamentId: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required").max(200),
  category: z.string().trim().max(80).optional(),
  vendor: z.string().trim().max(200).optional(),
  amount: z.string().min(1, "Amount is required"),
  reference: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export async function createExpenseAction(input: CreateExpenseInput): Promise<ActionResult> {
  const parsed = createExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const { tournamentId, title, category, vendor, amount, reference, notes } = parsed.data;
  const amountNum = moneyToNumber(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { ok: false, error: "Amount must be greater than 0." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("finance_expenses").insert({
    tournament_id: tournamentId,
    title: title.trim(),
    category: category?.trim() || null,
    vendor: vendor?.trim() || null,
    amount: amountNum,
    reference: reference?.trim() || null,
    notes: notes?.trim() || null,
    status: "posted",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/organizer/t/${tournamentId}/finance`);
  return { ok: true };
}
