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

const createTransferSchema = z.object({
  tournamentId: z.string().uuid(),
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.string().min(1, "Amount is required"),
  reference: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;

export async function createTransferAction(input: CreateTransferInput): Promise<ActionResult> {
  const parsed = createTransferSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const { tournamentId, fromAccountId, toAccountId, amount, reference, notes } = parsed.data;

  if (fromAccountId === toAccountId) {
    return { ok: false, error: "From and to accounts must be different." };
  }

  const amountNum = moneyToNumber(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { ok: false, error: "Amount must be greater than 0." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("finance_transfers").insert({
    tournament_id: tournamentId,
    from_account_id: fromAccountId,
    to_account_id: toAccountId,
    amount: amountNum,
    reference: reference?.trim() || null,
    notes: notes?.trim() || null,
    status: "posted",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/organizer/t/${tournamentId}/finance`);
  return { ok: true };
}
