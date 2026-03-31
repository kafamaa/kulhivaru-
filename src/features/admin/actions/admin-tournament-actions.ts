"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { AdminTournamentListFilters } from "../queries/admin-tournaments-rpc";
import { rpcAdminListTournaments } from "../queries/admin-tournaments-rpc";
import { tournamentsRowsToCsv } from "../utils/tournaments-csv";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function revalidateTournament(tournamentId: string) {
  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${tournamentId}`);
}

export async function adminTournamentPublishAction(input: {
  tournamentId: string;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_tournament_publish" as never,
    {
      p_tournament_id: input.tournamentId,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateTournament(input.tournamentId);
  return { ok: true };
}

export async function adminTournamentUnpublishAction(input: {
  tournamentId: string;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_tournament_unpublish" as never,
    {
      p_tournament_id: input.tournamentId,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateTournament(input.tournamentId);
  return { ok: true };
}

export async function adminTournamentCancelAction(input: {
  tournamentId: string;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_tournament_cancel" as never,
    {
      p_tournament_id: input.tournamentId,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateTournament(input.tournamentId);
  return { ok: true };
}

export async function adminTournamentArchiveAction(input: {
  tournamentId: string;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_tournament_archive" as never,
    {
      p_tournament_id: input.tournamentId,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateTournament(input.tournamentId);
  return { ok: true };
}

export async function adminTournamentSetLockedAction(input: {
  tournamentId: string;
  locked: boolean;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_tournament_set_locked" as never,
    {
      p_tournament_id: input.tournamentId,
      p_locked: input.locked,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateTournament(input.tournamentId);
  return { ok: true };
}

export async function adminTournamentSetFeaturedAction(input: {
  tournamentId: string;
  featured: boolean;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_tournament_set_featured" as never,
    {
      p_tournament_id: input.tournamentId,
      p_featured: input.featured,
      p_reason: input.reason.trim(),
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateTournament(input.tournamentId);
  return { ok: true };
}

export async function adminTournamentUpdateAction(input: {
  tournamentId: string;
  payload: Record<string, unknown>;
  reason: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "rpc_admin_update_tournament" as never,
    {
      p_tournament_id: input.tournamentId,
      p_payload: input.payload,
      p_reason: input.reason.trim() || null,
    } as never
  );
  if (error) return { ok: false, error: error.message };
  revalidateTournament(input.tournamentId);
  return { ok: true };
}

export async function adminBulkTournamentPublishAction(input: {
  tournamentIds: string[];
  reason: string;
}): Promise<ActionResult> {
  const failed: string[] = [];
  for (const id of input.tournamentIds) {
    const res = await adminTournamentPublishAction({
      tournamentId: id,
      reason: input.reason.trim(),
    });
    if (!res.ok) failed.push(`${id.slice(0, 8)}…: ${res.error}`);
  }
  if (failed.length) return { ok: false, error: failed.join("; ") };
  return { ok: true };
}

export async function adminBulkTournamentArchiveAction(input: {
  tournamentIds: string[];
  reason: string;
}): Promise<ActionResult> {
  const failed: string[] = [];
  for (const id of input.tournamentIds) {
    const res = await adminTournamentArchiveAction({
      tournamentId: id,
      reason: input.reason.trim(),
    });
    if (!res.ok) failed.push(`${id.slice(0, 8)}…: ${res.error}`);
  }
  if (failed.length) return { ok: false, error: failed.join("; ") };
  return { ok: true };
}

export async function adminBulkTournamentSetLockedAction(input: {
  tournamentIds: string[];
  locked: boolean;
  reason: string;
}): Promise<ActionResult> {
  const failed: string[] = [];
  for (const id of input.tournamentIds) {
    const res = await adminTournamentSetLockedAction({
      tournamentId: id,
      locked: input.locked,
      reason: input.reason.trim(),
    });
    if (!res.ok) failed.push(`${id.slice(0, 8)}…: ${res.error}`);
  }
  if (failed.length) return { ok: false, error: failed.join("; ") };
  return { ok: true };
}

export async function adminExportTournamentsCsvAction(
  filters: AdminTournamentListFilters
): Promise<ActionResult<{ csv: string }>> {
  const res = await rpcAdminListTournaments(filters);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, data: { csv: tournamentsRowsToCsv(res.rows) } };
}
