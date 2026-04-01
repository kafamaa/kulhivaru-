"use server";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

interface CsvRow {
  [key: string]: string;
}

function parseCsvText(text: string): CsvRow[] {
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!src) return [];
  const lines = src.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i]!;
      if (ch === '"') {
        const next = line[i + 1];
        if (inQuotes && next === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out.map((v) => v.replace(/^"(.*)"$/, "$1").trim());
  };

  const headers = parseLine(lines[0]!).map((h) => h.toLowerCase());
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseLine(lines[i]!);
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function pick(row: CsvRow, keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return "";
}

export interface PlayerRow {
  id: string;
  team_id: string | null;
  name: string;
  image_url: string | null;
  position: string | null;
  jersey_number?: string | null;
  nickname?: string | null;
  dob?: string | null;
  id_number?: string | null;
}

export async function addPlayerToTeamAction(input: {
  teamId: string;
  name: string;
  jerseyNumber?: string | null;
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
      .select("id, team_id, name, image_url, position, jersey_number, nickname, dob, id_number")
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
        jersey_number: input.jerseyNumber ?? existing.jersey_number ?? null,
        image_url: input.imageUrl ?? existing.image_url ?? null,
        nickname: input.nickname ?? existing.nickname ?? null,
        dob: input.dob ?? existing.dob ?? null,
        id_number: idNumber,
      })
      .eq("id", existing.id)
      .select("id, team_id, name, image_url, position, jersey_number, nickname, dob, id_number")
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
      jersey_number: input.jerseyNumber ?? null,
      image_url: input.imageUrl ?? null,
      nickname: input.nickname ?? null,
      dob: input.dob ?? null,
      id_number: idNumber,
    })
    .select("id, team_id, name, image_url, position, jersey_number, nickname, dob, id_number")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to add player" };

  revalidatePath(`/organizer/team/${input.teamId}`);
  return { ok: true, data: data as unknown as PlayerRow };
}

export async function updatePlayerAction(input: {
  playerId: string;
  teamId: string;
  name: string;
  jerseyNumber?: string | null;
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
      jersey_number: input.jerseyNumber ?? null,
      image_url: input.imageUrl ?? null,
      nickname: input.nickname ?? null,
      dob: input.dob ?? null,
      id_number: input.idNumber ?? null,
    })
    .eq("id", input.playerId)
    .select("id, team_id, name, image_url, position, jersey_number, nickname, dob, id_number")
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

export async function importPlayersCsvToTeamAction(input: {
  teamId: string;
  csvText: string;
}): Promise<
  ActionResult<{
    created: number;
    updated: number;
    skipped: number;
  }>
> {
  const supabase = await createSupabaseServerClient();
  const teamId = String(input.teamId ?? "").trim();
  if (!teamId) return { ok: false, error: "Team is required." };

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .single();
  if (teamError || !team) return { ok: false, error: "Team not found." };

  const rows = parseCsvText(input.csvText ?? "");
  if (rows.length === 0) return { ok: false, error: "CSV is empty or invalid." };

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = pick(row, ["name", "player_name", "full_name"]);
    if (!name) {
      skipped += 1;
      continue;
    }

    const position = pick(row, ["position"]) || null;
    const jerseyNumber = pick(row, ["jersey_number", "jersey", "shirt_number", "number"]) || null;
    const imageUrl = pick(row, ["image_url", "photo_url", "avatar_url"]) || null;
    const nickname = pick(row, ["nickname"]) || null;
    const dob = pick(row, ["dob", "date_of_birth"]) || null;
    const idNumber = pick(row, ["id_number", "passport", "id_card"]) || null;

    if (idNumber) {
      const { data: existing, error: existingError } = await supabase
        .from("players")
        .select("id")
        .eq("id_number", idNumber)
        .maybeSingle();
      if (existingError) {
        skipped += 1;
        continue;
      }
      if (existing?.id) {
        const { error: updateError } = await supabase
          .from("players")
          .update({
            team_id: teamId,
            name,
            position,
            jersey_number: jerseyNumber,
            image_url: imageUrl,
            nickname,
            dob,
            id_number: idNumber,
          })
          .eq("id", String(existing.id));
        if (updateError) skipped += 1;
        else updated += 1;
        continue;
      }
    }

    const { error: insertError } = await supabase.from("players").insert({
      team_id: teamId,
      name,
      position,
      jersey_number: jerseyNumber,
      image_url: imageUrl,
      nickname,
      dob,
      id_number: idNumber,
    });
    if (insertError) skipped += 1;
    else created += 1;
  }

  revalidatePath(`/organizer/team/${teamId}`);
  return { ok: true, data: { created, updated, skipped } };
}

