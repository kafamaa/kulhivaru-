import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface KnockoutSetupData {
  tournamentId: string;
  tournamentName: string;
  qualifiedTeams: Array<{ teamId: string; teamName: string; rank: number }>;
  slots: Array<{
    slotCode: string;
    matchId: string;
    status: string;
    homeTeamName: string;
    awayTeamName: string;
    sourceType: "manual" | "auto";
  }>;
}

export async function getKnockoutSetupData(
  tournamentId: string,
): Promise<KnockoutSetupData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: tournament, error: tError } = await supabase
    .from("tournaments")
    .select("id,name")
    .eq("id", tournamentId)
    .single();
  if (tError || !tournament) return null;

  const { data: standingsRows } = await supabase
    .from("standings_cache")
    .select("team_id,rank,group_id")
    .eq("tournament_id", tournamentId)
    .is("group_id", null)
    .order("rank", { ascending: true })
    .limit(16);

  const teamIds = Array.from(
    new Set((standingsRows ?? []).map((row: any) => String(row.team_id)).filter(Boolean)),
  );
  const { data: teamsRows } = teamIds.length
    ? await supabase.from("teams").select("id,name").in("id", teamIds)
    : { data: [] as any[] };
  const teamNameById = new Map<string, string>(
    (teamsRows ?? []).map((t: any) => [String(t.id), String(t.name)]),
  );

  const qualifiedTeams = (standingsRows ?? []).map((row: any) => ({
    teamId: String(row.team_id),
    teamName: teamNameById.get(String(row.team_id)) ?? "TBD",
    rank: Number(row.rank ?? 0),
  }));

  let { data: matchRows } = await supabase
    .from("matches")
    .select("id,slot_code,status,home_team_id,away_team_id,source_type")
    .eq("tournament_id", tournamentId)
    .not("slot_code", "is", null);

  if (!matchRows) {
    matchRows = [];
  }

  const slotTeamIds = Array.from(
    new Set(
      (matchRows ?? [])
        .flatMap((m: any) => [m.home_team_id, m.away_team_id])
        .filter(Boolean)
        .map(String),
    ),
  );
  const { data: slotTeams } = slotTeamIds.length
    ? await supabase.from("teams").select("id,name").in("id", slotTeamIds)
    : { data: [] as any[] };
  const slotTeamNameById = new Map<string, string>(
    (slotTeams ?? []).map((t: any) => [String(t.id), String(t.name)]),
  );

  const slots = (matchRows ?? []).map((m: any) => ({
    slotCode: String(m.slot_code ?? ""),
    matchId: String(m.id),
    status: String(m.status ?? "scheduled"),
    homeTeamName: m.home_team_id ? slotTeamNameById.get(String(m.home_team_id)) ?? "TBD" : "TBD",
    awayTeamName: m.away_team_id ? slotTeamNameById.get(String(m.away_team_id)) ?? "TBD" : "TBD",
    sourceType: ((m.source_type as "manual" | "auto") ?? "manual"),
  }));

  return {
    tournamentId: String(tournament.id),
    tournamentName: String(tournament.name),
    qualifiedTeams,
    slots,
  };
}
