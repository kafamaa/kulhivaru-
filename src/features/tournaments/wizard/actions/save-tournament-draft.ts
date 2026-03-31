"use server";

import type { WizardDraft } from "../types";
import { draftToSavePayload } from "../lib/wizard-mappers";

export type SaveDraftResult =
  | { ok: true; draftId: string }
  | { ok: false; error: string };

/**
 * Persist wizard draft. Assumes RPC e.g. rpc_save_tournament_draft(payload).
 * Replace with actual Supabase RPC call.
 */
export async function saveTournamentDraftAction(
  draft: WizardDraft
): Promise<SaveDraftResult> {
  try {
    const payload = draftToSavePayload(draft);
    // TODO: const supabase = await createSupabaseServerClient();
    // TODO: const { data, error } = await supabase.rpc('rpc_save_tournament_draft', { payload });
    // TODO: if (error) return { ok: false, error: error.message };
    // TODO: return { ok: true, draftId: data.draft_id };
    await new Promise((r) => setTimeout(r, 300));
    const draftId =
      typeof draft.draftId === "string" && draft.draftId
        ? draft.draftId
        : `draft-${Date.now()}`;
    return { ok: true, draftId };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save draft";
    return { ok: false, error: message };
  }
}
