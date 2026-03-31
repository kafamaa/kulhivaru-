"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { AdminRegistrationListFilters } from "../queries/admin-registrations-rpc";
import { rpcAdminListRegistrations } from "../queries/admin-registrations-rpc";
import { registrationsRowsToCsv } from "../utils/registrations-csv";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function revalidateRegistration(entryId: string, tournamentId?: string) {
  revalidatePath("/admin/registrations");
  revalidatePath(`/admin/registrations/${entryId}`);
  if (tournamentId) {
    revalidatePath(`/admin/tournaments/${tournamentId}`);
    revalidatePath(`/organizer/t/${tournamentId}/teams`);
  }
}

export async function adminApproveEntryAction(input: {
  entryId: string;
  reason: string;
  tournamentId?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_approve_entry" as never,
    { p_entry_id: input.entryId, p_reason: input.reason.trim() || null } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateRegistration(input.entryId, input.tournamentId);
  return { ok: true };
}

export async function adminForceApproveEntryAction(input: {
  entryId: string;
  reason: string;
  tournamentId?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_force_approve_entry" as never,
    { p_entry_id: input.entryId, p_reason: input.reason.trim() } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateRegistration(input.entryId, input.tournamentId);
  return { ok: true };
}

export async function adminRejectEntryAction(input: {
  entryId: string;
  reason: string;
  tournamentId?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_reject_entry" as never,
    { p_entry_id: input.entryId, p_reason: input.reason.trim() } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateRegistration(input.entryId, input.tournamentId);
  return { ok: true };
}

export async function adminResetEntryStatusAction(input: {
  entryId: string;
  reason: string;
  tournamentId?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_reset_entry_status" as never,
    { p_entry_id: input.entryId, p_reason: input.reason.trim() } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateRegistration(input.entryId, input.tournamentId);
  return { ok: true };
}

export async function adminMarkEntryPaidAction(input: {
  entryId: string;
  amount: number;
  method: string;
  reference: string;
  notes: string;
  reason: string;
  tournamentId?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_mark_entry_paid" as never,
    {
      p_entry_id: input.entryId,
      p_amount: input.amount,
      p_method: input.method.trim(),
      p_reference: input.reference.trim(),
      p_notes: input.notes.trim() || null,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateRegistration(input.entryId, input.tournamentId);
  return { ok: true };
}

export async function adminWaiveEntryFeeAction(input: {
  entryId: string;
  reason: string;
  tournamentId?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_waive_entry_fee" as never,
    { p_entry_id: input.entryId, p_reason: input.reason.trim() } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateRegistration(input.entryId, input.tournamentId);
  return { ok: true };
}

export async function adminRefundEntryAction(input: {
  entryId: string;
  amount: number;
  reason: string;
  tournamentId?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_refund_entry" as never,
    {
      p_entry_id: input.entryId,
      p_amount: input.amount,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateRegistration(input.entryId, input.tournamentId);
  return { ok: true };
}

export async function adminRemoveEntryAction(input: {
  entryId: string;
  reason: string;
  tournamentId?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_remove_entry" as never,
    { p_entry_id: input.entryId, p_reason: input.reason.trim() } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateRegistration(input.entryId, input.tournamentId);
  return { ok: true };
}

export async function adminUpdateRegistrationNotesAction(input: {
  entryId: string;
  notes: string;
  reason: string;
  tournamentId?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_update_registration_notes" as never,
    {
      p_entry_id: input.entryId,
      p_notes: input.notes,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateRegistration(input.entryId, input.tournamentId);
  return { ok: true };
}

export async function adminBulkApproveEntriesAction(input: {
  entryIds: string[];
  reason: string;
}): Promise<ActionResult> {
  const failed: string[] = [];
  for (const id of input.entryIds) {
    const res = await adminApproveEntryAction({
      entryId: id,
      reason: input.reason.trim(),
    });
    if (!res.ok) failed.push(`${id.slice(0, 8)}…: ${res.error}`);
  }
  if (failed.length) return { ok: false, error: failed.join("; ") };
  return { ok: true };
}

export async function adminBulkRejectEntriesAction(input: {
  entryIds: string[];
  reason: string;
}): Promise<ActionResult> {
  const failed: string[] = [];
  for (const id of input.entryIds) {
    const res = await adminRejectEntryAction({
      entryId: id,
      reason: input.reason.trim(),
    });
    if (!res.ok) failed.push(`${id.slice(0, 8)}…: ${res.error}`);
  }
  if (failed.length) return { ok: false, error: failed.join("; ") };
  return { ok: true };
}

export async function adminBulkResetEntriesAction(input: {
  entryIds: string[];
  reason: string;
}): Promise<ActionResult> {
  const failed: string[] = [];
  for (const id of input.entryIds) {
    const res = await adminResetEntryStatusAction({
      entryId: id,
      reason: input.reason.trim(),
    });
    if (!res.ok) failed.push(`${id.slice(0, 8)}…: ${res.error}`);
  }
  if (failed.length) return { ok: false, error: failed.join("; ") };
  return { ok: true };
}

export async function adminExportRegistrationsCsvAction(
  filters: AdminRegistrationListFilters
): Promise<ActionResult<{ csv: string }>> {
  const res = await rpcAdminListRegistrations(filters);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, data: { csv: registrationsRowsToCsv(res.rows) } };
}
