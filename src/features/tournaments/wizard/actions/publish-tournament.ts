"use server";

import type { WizardDraft } from "../types";
import { draftToSavePayload } from "../lib/wizard-mappers";
import { deriveWarningsAndBlockers } from "../lib/wizard-summary";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type PublishResult =
  | { ok: true; tournamentId: string; slug: string }
  | { ok: false; error: string };

/**
 * Publish tournament from wizard draft. Assumes RPC e.g. rpc_publish_tournament(payload).
 * Replace with actual Supabase RPC call. Caller should ensure blockers are resolved.
 */
export async function publishTournamentAction(
  draft: WizardDraft
): Promise<PublishResult> {
  const { blockers } = deriveWarningsAndBlockers(draft);
  if (blockers.length > 0) {
    return { ok: false, error: "Resolve all blockers before publishing." };
  }

  try {
    const payload = draftToSavePayload(draft);
    const supabase = await createSupabaseServerClient();
    let data: unknown = null;
    let error: { message: string } | null = null;
    for (const rpcName of [
      "rpc_publish_tournament_v3",
      "rpc_publish_tournament_v2",
      "rpc_publish_tournament",
    ]) {
      const res = await supabase.rpc(rpcName, { payload });
      data = res.data;
      error = res.error ? { message: res.error.message } : null;
      if (!error || !isMissingRpcError(error.message)) break;
    }

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Publish returned no data" };

    // Supabase returns a row (id, slug) or an array of rows
    if (Array.isArray(data) && data.length === 0) {
      return { ok: false, error: "Publish returned no rows" };
    }

    const row: unknown = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== "object") {
      return {
        ok: false,
        error: `Publish returned invalid data: ${safePreview(data)}`,
      };
    }

    const tournamentId = (row as { id?: string }).id;
    const slug = (row as { slug?: string }).slug;
    if (!tournamentId || !slug) {
      return {
        ok: false,
        error: `Publish returned missing id/slug: ${safePreview(data)}`,
      };
    }

    // Persist finance settings for this tournament (MVP).
    // This drives accurate "Expected Revenue" on the organizer finance page.
    try {
      const { error: financeError } = await supabase
        .from("tournament_finance_settings")
        .upsert(
          {
            tournament_id: tournamentId,
            entry_fee_amount: parseEntryFeeAmount(draft.registration.entryFee),
            currency: normalizeCurrency(draft.registration.currency),
            approval_mode: draft.registration.approvalMode,
            payment_required_before_approval:
              draft.registration.paymentRequiredBeforeApproval,
            allow_waitlist: draft.registration.allowWaitlist,
            refund_policy: draft.registration.refundPolicy ?? null,
          },
          { onConflict: "tournament_id" }
        );
      // We intentionally allow finance settings to fail without blocking publish.
      // The finance page will fall back to safe defaults and show warnings.
      void financeError;
    } catch {
      // Intentionally ignored.
    }

    return { ok: true, tournamentId, slug };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to publish";
    return { ok: false, error: message };
  }
}

function parseEntryFeeAmount(entryFee?: string): string {
  if (!entryFee) return "0.00";
  // Allow "10", "10.5", "10.00" etc. Store as 2-decimal numeric string.
  const cleaned = entryFee.replace(/[^0-9.]/g, "");
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) return "0.00";
  return num.toFixed(2);
}

function normalizeCurrency(currency?: string): string {
  if (!currency) return "USD";
  const c = currency.trim().toUpperCase();
  if (c.length !== 3) return "USD";
  return c;
}

function safePreview(value: unknown): string {
  try {
    const s = JSON.stringify(value);
    if (!s) return String(value);
    return s.length > 300 ? s.slice(0, 300) + "…" : s;
  } catch {
    return String(value);
  }
}

function isMissingRpcError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("could not find the function public.rpc_publish_tournament_v3") ||
    lower.includes("could not find the function public.rpc_publish_tournament_v2") ||
    lower.includes("function public.rpc_publish_tournament_v3") ||
    lower.includes("function public.rpc_publish_tournament_v2")
  );
}
