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

const recordPayablePaymentSchema = z.object({
  tournamentId: z.string().uuid(),
  payableId: z.string().uuid(),
  paymentAccountId: z.string().uuid(),
  amount: z.string().min(1),
  reference: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type RecordPayablePaymentInput = z.infer<typeof recordPayablePaymentSchema>;

export async function recordPayablePaymentAction(
  input: RecordPayablePaymentInput
): Promise<ActionResult> {
  const parsed = recordPayablePaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid payment input." };

  const { tournamentId, payableId, paymentAccountId, amount } = parsed.data;
  const amountNum = moneyToNumber(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { ok: false, error: "Amount must be greater than 0." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: payable, error: payableError } = await supabase
    .from("finance_payables")
    .select("id, tournament_id, title, amount_due, amount_paid, amount_remaining, status")
    .eq("id", payableId)
    .eq("tournament_id", tournamentId)
    .single();

  if (payableError || !payable) {
    return { ok: false, error: "Payable not found." };
  }

  const { data: paymentAccount, error: accountError } = await supabase
    .from("finance_accounts")
    .select("id, tournament_id, account_type")
    .eq("id", paymentAccountId)
    .eq("tournament_id", tournamentId)
    .single();

  if (accountError || !paymentAccount) {
    return { ok: false, error: "Payment account not found." };
  }

  const paymentAccountType = String(paymentAccount.account_type ?? "");
  if (!["cash", "bank", "wallet"].includes(paymentAccountType)) {
    return { ok: false, error: "Selected account cannot be used for payments." };
  }

  const { data: payableAccountRows } = await supabase
    .from("finance_accounts")
    .select("id")
    .eq("tournament_id", tournamentId)
    .eq("account_type", "payable");

  const payableAccountId =
    payableAccountRows && payableAccountRows.length > 0
      ? String(payableAccountRows[0].id)
      : "";

  if (!payableAccountId) {
    return { ok: false, error: "Payable account missing." };
  }

  const currentRemaining = moneyToNumber(payable.amount_remaining);
  if (amountNum > currentRemaining) {
    return { ok: false, error: `Amount cannot exceed remaining ${currentRemaining.toFixed(2)}.` };
  }

  const nextAmountPaid = moneyToNumber(payable.amount_paid) + amountNum;
  const nextAmountRemaining = Math.max(0, currentRemaining - amountNum);
  const hadAnyPaid = moneyToNumber(payable.amount_paid) > 0;
  const nextStatus = nextAmountRemaining <= 0 ? "paid" : hadAnyPaid ? "partial" : "open";

  const { error: updateError } = await supabase
    .from("finance_payables")
    .update({
      amount_paid: nextAmountPaid,
      amount_remaining: nextAmountRemaining,
      status: nextStatus,
    })
    .eq("id", payableId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  const reference =
    parsed.data.reference?.trim() || `PAY-PAY-${Date.now()}`;

  const { data: insertedJournal, error: journalError } = await supabase
    .from("finance_ledger_journals")
    .insert({
      tournament_id: tournamentId,
      journal_type: "payable_payment",
      reference,
      status: "posted",
      posted_at: new Date().toISOString(),
      notes: `Payment for payable: ${payable.title}`,
      created_by: null,
    })
    .select("id")
    .single();

  if (journalError || !insertedJournal) {
    return { ok: false, error: journalError?.message ?? "Failed to create ledger journal." };
  }

  // Debit payable (reduce liability), Credit cash (reduce asset)
  const { error: linesError } = await supabase.from("finance_ledger_lines").insert([
    {
      journal_id: insertedJournal.id,
      account_id: payableAccountId,
      side: "debit",
      amount: amountNum,
      description: `Payment for ${payable.title}`,
    },
    {
      journal_id: insertedJournal.id,
      account_id: paymentAccountId,
      side: "credit",
      amount: amountNum,
      description: `Payment for payable: ${payable.title}`,
    },
  ]);

  if (linesError) {
    return { ok: false, error: linesError.message };
  }

  revalidatePath(`/organizer/t/${tournamentId}/finance`);
  return { ok: true };
}
