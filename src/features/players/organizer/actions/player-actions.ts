"use server";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface PlayerRow {
  id: string;
  team_id: string | null;
  name: string;
  image_url: string | null;
  position: string | null;
  nickname?: string | null;
  dob?: string | null;
  id_number?: string | null;
}

export async function addPlayerToTeamAction(input: {
  teamId: string;
  name: string;
  position?: string | null;
  imageUrl?: string | null;
  nickname?: string | null;
  dob?: string | null; // ISO date (yyyy-mm-dd)
  idNumber?: string | null;
}): Promise<ActionResult<PlayerRow>> {
  const supabase = await createSupabaseServerClient();
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Player name is required" };

  let existing: PlayerRow | null = null;
  const idNumber = input.idNumber?.trim() || null;
  if (idNumber) {
    const { data, error } = await supabase
      .from("players")
      .select("id, team_id, name, image_url, position, nickname, dob, id_number")
      .eq("id_number", idNumber)
      .maybeSingle();
    if (error) {
      return { ok: false, error: error.message };
    }
    if (data) {
      existing = data as unknown as PlayerRow;
    }
  }

  if (existing && existing.team_id && existing.team_id !== input.teamId) {
    return {
      ok: false,
      error:
        "A player with this ID number already belongs to another team. Remove them from that team before assigning them here.",
    };
  }

  // If player with this ID already exists (no team or same team), update it instead of inserting
  if (existing) {
    const { data, error } = await supabase
      .from("players")
      .update({
        team_id: input.teamId,
        name,
        position: input.position ?? existing.position ?? null,
        image_url: input.imageUrl ?? existing.image_url ?? null,
        nickname: input.nickname ?? existing.nickname ?? null,
        dob: input.dob ?? existing.dob ?? null,
        id_number: idNumber,
      })
      .eq("id", existing.id)
      .select("id, team_id, name, image_url, position, nickname, dob, id_number")
      .single();

    if (error || !data)
      return { ok: false, error: error?.message ?? "Failed to add player" };

    revalidatePath(`/organizer/team/${input.teamId}`);
    return { ok: true, data: data as unknown as PlayerRow };
  }

  const { data, error } = await supabase
    .from("players")
    .insert({
      team_id: input.teamId,
      name,
      position: input.position ?? null,
      image_url: input.imageUrl ?? null,
      nickname: input.nickname ?? null,
      dob: input.dob ?? null,
      id_number: idNumber,
    })
    .select("id, team_id, name, image_url, position, nickname, dob, id_number")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to add player" };

  revalidatePath(`/organizer/team/${input.teamId}`);
  return { ok: true, data: data as unknown as PlayerRow };
}

export async function updatePlayerAction(input: {
  playerId: string;
  teamId: string;
  name: string;
  position?: string | null;
  imageUrl?: string | null;
  nickname?: string | null;
  dob?: string | null;
  idNumber?: string | null;
}): Promise<ActionResult<PlayerRow>> {
  const supabase = await createSupabaseServerClient();
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Player name is required" };

  const { data, error } = await supabase
    .from("players")
    .update({
      name,
      position: input.position ?? null,
      image_url: input.imageUrl ?? null,
      nickname: input.nickname ?? null,
      dob: input.dob ?? null,
      id_number: input.idNumber ?? null,
    })
    .eq("id", input.playerId)
    .select("id, team_id, name, image_url, position, nickname, dob, id_number")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to update player" };

  revalidatePath(`/organizer/team/${input.teamId}`);
  return { ok: true, data: data as unknown as PlayerRow };
}

export async function removePlayerAction(input: {
  playerId: string;
  teamId: string;
}): Promise<ActionResult<null>> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("players").delete().eq("id", input.playerId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/organizer/team/${input.teamId}`);
  return { ok: true, data: null };
}

