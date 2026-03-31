"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { getTeamsNotInTournament } from "../queries/get-teams-not-in-tournament";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateEntryStatusAction(
  entryId: string,
  status: "approved" | "rejected",
  tournamentId: string
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("team_entries")
    .update({ status })
    .eq("id", entryId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/organizer/t/${tournamentId}/teams`);
  revalidatePath(`/organizer/t/${tournamentId}`);
  revalidatePath("/organizer");
  return { ok: true };
}

export async function addTeamToTournamentAction(
  tournamentId: string,
  teamId: string,
  status: "pending" | "approved" = "pending"
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("team_entries").insert({
    tournament_id: tournamentId,
    team_id: teamId,
    status,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/organizer/t/${tournamentId}/teams`);
  revalidatePath(`/organizer/t/${tournamentId}`);
  revalidatePath("/organizer");
  return { ok: true };
}

export async function removeEntryAction(
  entryId: string,
  tournamentId: string
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("team_entries").delete().eq("id", entryId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/organizer/t/${tournamentId}/teams`);
  revalidatePath(`/organizer/t/${tournamentId}`);
  revalidatePath("/organizer");
  return { ok: true };
}

export async function getTeamsNotInTournamentAction(tournamentId: string) {
  return getTeamsNotInTournament(tournamentId);
}
