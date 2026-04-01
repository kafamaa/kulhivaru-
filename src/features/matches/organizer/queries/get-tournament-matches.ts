import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface OrganizerTournamentMatchRow {
  id: string;
  tournamentId: string;
  roundLabel: string | null;
  status: string;
  scheduledAt: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  slotCode: string | null;
  sourceType: "manual" | "auto";
  homeSource: string | null;
  awaySource: string | null;
  manOfTheMatchPlayerId: string | null;
  manOfTheMatchPlayerName: string | null;
}

export interface OrganizerTournamentMatchesData {
  tournamentId: string;
  tournamentName: string;
  championTeamName: string | null;
  matches: OrganizerTournamentMatchRow[];
  teams: Array<{ id: string; name: string }>;
  qualifiedTeams: Array<{ teamId: string; teamName: string; rank: number }>;
}

export async function getTournamentMatches(
  tournamentId: string
): Promise<OrganizerTournamentMatchesData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: tournament, error: tError } = await supabase
    .from("tournaments")
    .select("id, name, champion_team_id")
    .eq("id", tournamentId)
    .single();

  if (tError || !tournament) return null;

  let { data: matches, error } = await supabase
    .from("matches")
    .select(
      "id, tournament_id, round_label, status, scheduled_at, home_team_id, away_team_id, home_score, away_score, slot_code, source_type, home_source, away_source"
    )
    .eq("tournament_id", tournamentId)
    .order("scheduled_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  if (error && isMissingKnockoutColumnsError(error.message)) {
    // Backward compatibility: database not migrated yet.
    const fallback = await supabase
      .from("matches")
      .select(
        "id, tournament_id, round_label, status, scheduled_at, home_team_id, away_team_id, home_score, away_score"
      )
      .eq("tournament_id", tournamentId)
      .order("scheduled_at", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });
    matches = fallback.data as any[] | null;
    error = fallback.error;
  }

  const { data: teamEntries } = await supabase
    .from("team_entries")
    .select("team_id,teams(id,name)")
    .eq("tournament_id", tournamentId)
    .in("status", ["approved", "pending"]);

  const teams = Array.from(
    new Map(
      (teamEntries ?? [])
        .map((row: any) => row.teams)
        .filter(Boolean)
        .map((team: any) => [String(team.id), { id: String(team.id), name: String(team.name) }]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const { data: standingsRows } = await supabase
    .from("standings_cache")
    .select("team_id,rank,group_id")
    .eq("tournament_id", tournamentId)
    .is("group_id", null)
    .order("rank", { ascending: true })
    .limit(16);

  const standingTeamIds = Array.from(
    new Set((standingsRows ?? []).map((r: any) => String(r.team_id)).filter(Boolean)),
  );
  const { data: standingTeams } = standingTeamIds.length
    ? await supabase.from("teams").select("id,name").in("id", standingTeamIds)
    : { data: [] as any[] };
  const standingTeamNameById = new Map<string, string>(
    (standingTeams ?? []).map((t: any) => [String(t.id), String(t.name)]),
  );
  const qualifiedTeams = (standingsRows ?? []).map((row: any) => ({
    teamId: String(row.team_id),
    teamName: standingTeamNameById.get(String(row.team_id)) ?? "TBD",
    rank: Number(row.rank ?? 0),
  }));

  const championTeamId = (tournament as any).champion_team_id
    ? String((tournament as any).champion_team_id)
    : null;
  let championTeamName: string | null = null;
  if (championTeamId) {
    const { data: championRow } = await supabase
      .from("teams")
      .select("id,name")
      .eq("id", championTeamId)
      .maybeSingle();
    championTeamName = championRow?.name ? String(championRow.name) : null;
  }

  if (error || !matches) {
    return {
      tournamentId,
      tournamentName: tournament.name,
      championTeamName,
      matches: [],
      teams,
      qualifiedTeams,
    };
  }

  const teamIds = new Set<string>();
  (matches as any[]).forEach((m) => {
    if (m.home_team_id) teamIds.add(String(m.home_team_id));
    if (m.away_team_id) teamIds.add(String(m.away_team_id));
  });

  let nameById: Record<string, string> = {};
  if (teamIds.size > 0) {
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", Array.from(teamIds));
    nameById = (teams ?? []).reduce((acc: Record<string, string>, t: any) => {
      acc[String(t.id)] = String(t.name);
      return acc;
    }, {});
  }

  const matchIds = (matches as any[]).map((m) => String(m.id));
  let motmByMatchId = new Map<string, { playerId: string; playerName: string }>();
  if (matchIds.length > 0) {
    const { data: awardRows, error: awardError } = await supabase
      .from("match_player_awards")
      .select("match_id, player_id")
      .eq("award_type", "man_of_the_match")
      .in("match_id", matchIds);
    if (!awardError) {
      const motmPlayerIds = Array.from(
        new Set((awardRows ?? []).map((r: any) => String(r.player_id)).filter(Boolean)),
      );
      const { data: motmPlayers } = motmPlayerIds.length
        ? await supabase.from("players").select("id,name").in("id", motmPlayerIds)
        : { data: [] as any[] };
      const motmNameById = new Map<string, string>(
        (motmPlayers ?? []).map((p: any) => [String(p.id), String(p.name)]),
      );
      motmByMatchId = new Map<string, { playerId: string; playerName: string }>(
        (awardRows ?? []).map((r: any) => [
          String(r.match_id),
          {
            playerId: String(r.player_id),
            playerName: motmNameById.get(String(r.player_id)) ?? "Player",
          },
        ]),
      );
    }
  }

  const mapped: OrganizerTournamentMatchRow[] = (matches as any[]).map((m) => ({
    id: String(m.id),
    tournamentId: String(m.tournament_id),
    roundLabel: (m.round_label as string) ?? null,
    status: String(m.status),
    scheduledAt: (m.scheduled_at as string) ?? null,
    homeTeamId: (m.home_team_id as string) ?? null,
    awayTeamId: (m.away_team_id as string) ?? null,
    homeTeamName: m.home_team_id ? nameById[String(m.home_team_id)] ?? "TBD" : "TBD",
    awayTeamName: m.away_team_id ? nameById[String(m.away_team_id)] ?? "TBD" : "TBD",
    homeScore: (m.home_score as number) ?? null,
    awayScore: (m.away_score as number) ?? null,
    slotCode: (m.slot_code as string) ?? null,
    sourceType: ((m.source_type as "manual" | "auto") ?? "manual"),
    homeSource: (m.home_source as string) ?? null,
    awaySource: (m.away_source as string) ?? null,
    manOfTheMatchPlayerId: motmByMatchId.get(String(m.id))?.playerId ?? null,
    manOfTheMatchPlayerName: motmByMatchId.get(String(m.id))?.playerName ?? null,
  }));

  return {
    tournamentId: tournament.id as string,
    tournamentName: tournament.name as string,
    championTeamName,
    matches: mapped,
    teams,
    qualifiedTeams,
  };
}

function isMissingKnockoutColumnsError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("slot_code") ||
    lower.includes("source_type") ||
    lower.includes("home_source") ||
    lower.includes("away_source")
  );
}

