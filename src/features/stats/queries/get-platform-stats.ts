import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface PlatformStats {
  tournamentsHosted: number;
  matchesPlayed: number;
  teamsRegistered: number;
}

export async function getPlatformStats(): Promise<PlatformStats | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("platform_stats")
    .select("tournaments_hosted, matches_played, teams_registered")
    .single();

  if (error || !data) {
    return null;
  }

  return {
    tournamentsHosted: Number(data.tournaments_hosted) ?? 0,
    matchesPlayed: Number(data.matches_played) ?? 0,
    teamsRegistered: Number(data.teams_registered) ?? 0,
  };
}
