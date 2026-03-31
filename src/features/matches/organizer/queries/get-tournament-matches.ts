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
}

export interface OrganizerTournamentMatchesData {
  tournamentId: string;
  tournamentName: string;
  matches: OrganizerTournamentMatchRow[];
}

export async function getTournamentMatches(
  tournamentId: string
): Promise<OrganizerTournamentMatchesData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: tournament, error: tError } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("id", tournamentId)
    .single();

  if (tError || !tournament) return null;

  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      "id, tournament_id, round_label, status, scheduled_at, home_team_id, away_team_id, home_score, away_score"
    )
    .eq("tournament_id", tournamentId)
    .order("scheduled_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  if (error || !matches) {
    return { tournamentId, tournamentName: tournament.name, matches: [] };
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
  }));

  return {
    tournamentId: tournament.id as string,
    tournamentName: tournament.name as string,
    matches: mapped,
  };
}

