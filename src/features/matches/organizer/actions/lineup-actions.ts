"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

function uniq(ids: string[]) {
  return Array.from(new Set(ids.map((x) => String(x).trim()).filter(Boolean)));
}

export async function saveMatchLineupAction(input: {
  tournamentId: string;
  matchId: string;
  teamId: string;
  startingPlayerIds: string[];
  substitutePlayerIds: string[];
  source?: "manual" | "auto";
}): Promise<Result<{ saved: number }>> {
  const supabase = await createSupabaseServerClient();
  const matchId = String(input.matchId ?? "").trim();
  const teamId = String(input.teamId ?? "").trim();
  if (!matchId || !teamId) return { ok: false, error: "Match and team are required." };

  const starting = uniq(input.startingPlayerIds ?? []);
  const substitutes = uniq((input.substitutePlayerIds ?? []).filter((id) => !starting.includes(id)));
  const source = input.source === "auto" ? "auto" : "manual";

  const { error: delError } = await supabase
    .from("match_lineups")
    .delete()
    .eq("match_id", matchId)
    .eq("team_id", teamId);
  if (delError) return { ok: false, error: delError.message };

  const rows = [
    ...starting.map((playerId) => ({
      match_id: matchId,
      team_id: teamId,
      player_id: playerId,
      role: "starting" as const,
      source,
    })),
    ...substitutes.map((playerId) => ({
      match_id: matchId,
      team_id: teamId,
      player_id: playerId,
      role: "substitute" as const,
      source,
    })),
  ];

  if (rows.length > 0) {
    const { error: insError } = await supabase.from("match_lineups").insert(rows);
    if (insError) return { ok: false, error: insError.message };
  }

  revalidatePath(`/organizer/match/${matchId}`);
  revalidatePath(`/organizer/t/${input.tournamentId}/matches`);
  revalidatePath(`/match/${matchId}`);
  return { ok: true, data: { saved: rows.length } };
}

export async function autoGenerateMatchLineupAction(input: {
  tournamentId: string;
  matchId: string;
  teamId: string;
  sport: string;
}): Promise<
  Result<{ startingPlayerIds: string[]; substitutePlayerIds: string[]; saved: number }>
> {
  const supabase = await createSupabaseServerClient();
  const teamId = String(input.teamId ?? "").trim();
  if (!teamId) return { ok: false, error: "Team is required." };

  const { data: roster, error: rosterError } = await supabase
    .from("players")
    .select("id, name, jersey_number, created_at")
    .eq("team_id", teamId)
    .order("jersey_number", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .order("created_at", { ascending: true });

  if (rosterError) return { ok: false, error: rosterError.message };
  const ids = (roster ?? []).map((r: any) => String(r.id));
  if (ids.length === 0) return { ok: false, error: "No roster players found for this team." };

  const isFutsal = (input.sport ?? "").trim().toLowerCase() === "futsal";
  const startingCount = isFutsal ? 5 : 11;
  const subCount = isFutsal ? 7 : 9;

  const startingPlayerIds = ids.slice(0, startingCount);
  const substitutePlayerIds = ids.slice(startingCount, startingCount + subCount);

  const saved = await saveMatchLineupAction({
    tournamentId: input.tournamentId,
    matchId: input.matchId,
    teamId,
    startingPlayerIds,
    substitutePlayerIds,
    source: "auto",
  });
  if (!saved.ok) return saved;

  return {
    ok: true,
    data: {
      startingPlayerIds,
      substitutePlayerIds,
      saved: saved.data.saved,
    },
  };
}
