"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { getTeamsNotInTournament } from "../queries/get-teams-not-in-tournament";
import { slugify } from "@/src/features/teams/lib/slugify";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type ImportCsvActionResult =
  | {
      ok: true;
      data: {
        teamsCreated: number;
        entriesAdded: number;
        playersCreated: number;
        playersUpdated: number;
        skippedRows: number;
      };
    }
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

export async function importTeamsAndPlayersCsvAction(input: {
  tournamentId: string;
  teamsCsvText: string;
  playersCsvText?: string;
  defaultEntryStatus?: "pending" | "approved";
}): Promise<ImportCsvActionResult> {
  const supabase = await createSupabaseServerClient();
  const tournamentId = String(input.tournamentId ?? "").trim();
  if (!tournamentId) return { ok: false, error: "Tournament is required." };

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id")
    .eq("id", tournamentId)
    .single();
  if (tournamentError || !tournament) {
    return { ok: false, error: "Tournament not found." };
  }

  const teamRows = parseCsvText(input.teamsCsvText ?? "");
  if (teamRows.length === 0) {
    return { ok: false, error: "Teams CSV is empty or invalid." };
  }

  const defaultStatus: "pending" | "approved" =
    input.defaultEntryStatus === "pending" ? "pending" : "approved";

  const teamBySlug = new Map<string, string>();
  const teamByName = new Map<string, string>();
  let teamsCreated = 0;
  let entriesAdded = 0;
  let playersCreated = 0;
  let playersUpdated = 0;
  let skippedRows = 0;

  for (const row of teamRows) {
    const name = pick(row, ["name", "team_name", "team"]);
    if (!name) {
      skippedRows += 1;
      continue;
    }
    const slugRaw = pick(row, ["slug", "team_slug"]);
    const slug = (slugRaw || slugify(name)).toLowerCase();
    const logoUrl = pick(row, ["logo_url", "logo", "team_logo_url"]) || null;
    const statusRaw = pick(row, ["status", "entry_status"]).toLowerCase();
    const status: "pending" | "approved" | "rejected" =
      statusRaw === "pending" || statusRaw === "rejected" || statusRaw === "approved"
        ? (statusRaw as "pending" | "approved" | "rejected")
        : defaultStatus;

    let teamId: string | null = null;
    const { data: teamByNameRow } = await supabase
      .from("teams")
      .select("id")
      .ilike("name", name)
      .limit(1)
      .maybeSingle();
    if (teamByNameRow?.id) teamId = String(teamByNameRow.id);

    if (!teamId) {
      const { data: inserted, error: insertError } = await supabase
        .from("teams")
        .insert({
          name,
          slug,
          logo_url: logoUrl,
        })
        .select("id")
        .single();
      if (insertError || !inserted) {
        skippedRows += 1;
        continue;
      }
      teamId = String(inserted.id);
      teamsCreated += 1;
    } else if (logoUrl) {
      await supabase
        .from("teams")
        .update({ logo_url: logoUrl })
        .eq("id", teamId);
    }

    const { error: entryError } = await supabase.from("team_entries").insert({
      tournament_id: tournamentId,
      team_id: teamId,
      status,
    });
    if (!entryError) entriesAdded += 1;

    teamBySlug.set(slug, teamId);
    teamByName.set(name.toLowerCase(), teamId);
  }

  const playersCsv = (input.playersCsvText ?? "").trim();
  if (playersCsv.length > 0) {
    const playerRows = parseCsvText(playersCsv);
    for (const row of playerRows) {
      const playerName = pick(row, ["name", "player_name", "full_name"]);
      if (!playerName) {
        skippedRows += 1;
        continue;
      }
      const teamSlug = pick(row, ["team_slug", "slug"]).toLowerCase();
      const teamName = pick(row, ["team_name", "team"]).toLowerCase();
      const teamId = (teamSlug ? teamBySlug.get(teamSlug) : null) || (teamName ? teamByName.get(teamName) : null);
      if (!teamId) {
        skippedRows += 1;
        continue;
      }

      const imageUrl = pick(row, ["image_url", "photo_url", "avatar_url"]) || null;
      const jerseyNumber = pick(row, ["jersey_number", "jersey", "shirt_number", "number"]) || null;
      const position = pick(row, ["position"]) || null;
      const nickname = pick(row, ["nickname"]) || null;
      const dob = pick(row, ["dob", "date_of_birth"]) || null;
      const idNumber = pick(row, ["id_number", "passport", "id_card"]) || null;

      if (idNumber) {
        const { data: existing } = await supabase
          .from("players")
          .select("id")
          .eq("id_number", idNumber)
          .maybeSingle();

        if (existing?.id) {
          await supabase
            .from("players")
            .update({
              team_id: teamId,
              name: playerName,
              position,
              jersey_number: jerseyNumber,
              image_url: imageUrl,
              nickname,
              dob,
              id_number: idNumber,
            })
            .eq("id", String(existing.id));
          playersUpdated += 1;
          continue;
        }
      }

      const { error: playerInsertError } = await supabase.from("players").insert({
        team_id: teamId,
        name: playerName,
        position,
        jersey_number: jerseyNumber,
        image_url: imageUrl,
        nickname,
        dob,
        id_number: idNumber,
      });
      if (playerInsertError) skippedRows += 1;
      else playersCreated += 1;
    }
  }

  revalidatePath(`/organizer/t/${tournamentId}/teams`);
  revalidatePath(`/organizer/t/${tournamentId}`);
  revalidatePath("/organizer");

  return {
    ok: true,
    data: {
      teamsCreated,
      entriesAdded,
      playersCreated,
      playersUpdated,
      skippedRows,
    },
  };
}
