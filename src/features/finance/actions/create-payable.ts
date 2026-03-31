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

const createPayableSchema = z.object({
  tournamentId: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required").max(200),
  category: z.string().trim().max(80).optional(),
  payee: z.string().trim().max(200).optional(),
  amountDue: z.string().min(1, "Amount is required"),
  dueAt: z.string().optional(),
  reference: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type CreatePayableInput = z.infer<typeof createPayableSchema>;

export async function createPayableAction(
  input: CreatePayableInput
): Promise<ActionResult & { payableId?: string }> {
  const parsed = createPayableSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const { tournamentId, title, category, payee, amountDue, dueAt, reference, notes } = parsed.data;
  const amount = moneyToNumber(amountDue);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be greater than 0." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: inserted, error } = await supabase
    .from("finance_payables")
    .insert({
      tournament_id: tournamentId,
      title: title.trim(),
      category: category?.trim() || null,
      payee: payee?.trim() || null,
      amount_due: amount,
      amount_paid: 0,
      amount_remaining: amount,
      due_at: dueAt && dueAt.trim() ? dueAt.trim() : null,
      status: "open",
      reference: reference?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Failed to create payable." };
  }

  revalidatePath(`/organizer/t/${tournamentId}/finance`);
  return { ok: true, payableId: inserted.id };
}
