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

const recordReceivablePaymentSchema = z.object({
  tournamentId: z.string().uuid(),
  receivableId: z.string().uuid(),
  paymentAccountId: z.string().uuid(),
  amount: z.string().min(1),
  reference: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type RecordReceivablePaymentInput = z.infer<
  typeof recordReceivablePaymentSchema
>;

export async function recordReceivablePaymentAction(
  input: RecordReceivablePaymentInput
): Promise<ActionResult & { paymentId?: string }> {
  const parsed = recordReceivablePaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid payment input." };

  const { tournamentId, receivableId, paymentAccountId, amount } = parsed.data;
  const amountNum = moneyToNumber(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { ok: false, error: "Amount must be greater than 0." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: receivable, error: receivableError } = await supabase
    .from("finance_receivables")
    .select("id, tournament_id, team_entry_id, amount_due, amount_paid, amount_waived, amount_remaining, status, due_at")
    .eq("id", receivableId)
    .eq("tournament_id", tournamentId)
    .single();

  if (receivableError || !receivable) {
    return { ok: false, error: "Receivable not found." };
  }

  const { data: paymentAccount, error: accountError } = await supabase
    .from("finance_accounts")
    .select("id, tournament_id, name, account_type")
    .eq("id", paymentAccountId)
    .eq("tournament_id", tournamentId)
    .single();

  if (accountError || !paymentAccount) {
    return { ok: false, error: "Payment account not found." };
  }

  const paymentAccountType = String(paymentAccount.account_type ?? "");
  if (!["cash", "bank", "wallet"].includes(paymentAccountType)) {
    return { ok: false, error: "Selected account cannot receive payments." };
  }

  const { data: receivableAccountRows, error: receivableAccountError } = await supabase
    .from("finance_accounts")
    .select("id")
    .eq("tournament_id", tournamentId)
    .eq("account_type", "receivable");

  const receivableAccountId =
    receivableAccountRows && receivableAccountRows.length > 0
      ? String(receivableAccountRows[0].id)
      : "";

  if (receivableAccountError || !receivableAccountId) {
    return { ok: false, error: "Receivable account missing." };
  }

  // 1) Insert payment
  const { data: insertedPayment, error: paymentInsertError } = await supabase
    .from("finance_payments")
    .insert({
      tournament_id: tournamentId,
      receivable_id: receivableId,
      team_entry_id: receivable.team_entry_id,
      amount: amountNum,
      payment_date: new Date().toISOString(),
      account_id: paymentAccountId,
      reference: parsed.data.reference ? parsed.data.reference : null,
      notes: parsed.data.notes ? parsed.data.notes : null,
      status: "posted",
    })
    .select("id")
    .single();

  if (paymentInsertError || !insertedPayment) {
    return { ok: false, error: paymentInsertError?.message ?? "Failed to record payment." };
  }

  // 2) Update receivable totals
  const nextAmountPaid =
    moneyToNumber(receivable.amount_paid) + amountNum;
  const nextAmountRemaining =
    Math.max(0, moneyToNumber(receivable.amount_remaining) - amountNum);

  const hadAnyPaid = moneyToNumber(receivable.amount_paid) > 0;
  const nextStatus = nextAmountRemaining <= 0 ? "paid" : hadAnyPaid ? "partial" : "open";

  const { error: receivableUpdateError } = await supabase
    .from("finance_receivables")
    .update({
      amount_paid: nextAmountPaid,
      amount_remaining: nextAmountRemaining,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", receivableId);

  if (receivableUpdateError) {
    return { ok: false, error: receivableUpdateError.message };
  }

  // 3) Write a minimal ledger entry for auditability
  const reference =
    parsed.data.reference && parsed.data.reference.trim()
      ? parsed.data.reference.trim()
      : `PAY-${Date.now()}`;

  const { data: insertedJournal, error: journalInsertError } = await supabase
    .from("finance_ledger_journals")
    .insert({
      tournament_id: tournamentId,
      journal_type: "receivable_payment",
      reference,
      status: "posted",
      posted_at: new Date().toISOString(),
      notes: `Payment for receivable ${receivableId}`,
      created_by: null,
    })
    .select("id")
    .single();

  if (journalInsertError || !insertedJournal) {
    return { ok: false, error: journalInsertError?.message ?? "Failed to create ledger journal." };
  }

  const { error: linesError } = await supabase
    .from("finance_ledger_lines")
    .insert([
      {
        journal_id: insertedJournal.id,
        account_id: paymentAccountId,
        side: "debit",
        amount: amountNum,
        description: `Receipt recorded: ${reference}`,
      },
      {
        journal_id: insertedJournal.id,
        account_id: receivableAccountId,
        side: "credit",
        amount: amountNum,
        description: `Settlement against receivable ${receivableId}`,
      },
    ]);

  if (linesError) {
    return { ok: false, error: linesError.message };
  }

  revalidatePath(`/organizer/t/${tournamentId}/finance`);
  return { ok: true, paymentId: insertedPayment.id };
}

