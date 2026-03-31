import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface PublicMatchDetailTeam {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
}

export interface PublicMatchDetail {
  id: string;
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  tournamentSport: string;
  tournamentStatus: string;
  scheduledAt: string | null;
  roundLabel: string | null;
  liveMinute: number | null;
  status: string;

  home: PublicMatchDetailTeam | null;
  away: PublicMatchDetailTeam | null;

  homeScore: number | null;
  awayScore: number | null;
  scoreText: string | null;
}

export async function getPublicMatchDetail(input: {
  matchId: string;
}): Promise<PublicMatchDetail | null> {
  const supabase = await createSupabaseServerClient();

  const { data: match, error } = await supabase
    .from("matches")
    .select(
      "id,tournament_id,status,scheduled_at,round_label,live_minute,home_team_id,away_team_id,home_score,away_score,tournaments(id,name,slug,sport,status)"
    )
    .eq("id", input.matchId)
    .single();

  if (error || !match) return null;

  const homeTeamId = match.home_team_id ? String(match.home_team_id) : null;
  const awayTeamId = match.away_team_id ? String(match.away_team_id) : null;
  const teamIds = [homeTeamId, awayTeamId].filter(Boolean) as string[];

  const { data: teams } = teamIds.length
    ? await supabase
        .from("teams")
        .select("id,name,logo_url")
        .in("id", teamIds)
    : { data: [] as any[] };

  const teamById = new Map<string, any>(
    (teams ?? []).map((t: any) => [String(t.id), t])
  );

  const home = homeTeamId
    ? ({
        teamId: homeTeamId,
        teamName: String(teamById.get(homeTeamId)?.name ?? "Home team"),
        logoUrl: (teamById.get(homeTeamId)?.logo_url as string | null) ?? null,
      } satisfies PublicMatchDetailTeam)
    : null;
  const away = awayTeamId
    ? ({
        teamId: awayTeamId,
        teamName: String(teamById.get(awayTeamId)?.name ?? "Away team"),
        logoUrl: (teamById.get(awayTeamId)?.logo_url as string | null) ?? null,
      } satisfies PublicMatchDetailTeam)
    : null;

  const homeScore = match.home_score != null ? Number(match.home_score) : null;
  const awayScore = match.away_score != null ? Number(match.away_score) : null;
  const scoreText =
    homeScore != null && awayScore != null ? `${homeScore} - ${awayScore}` : null;

  return {
    id: String(match.id),
    tournamentId: String(match.tournament_id),
    tournamentName: String(match.tournaments?.name ?? "Tournament"),
    tournamentSlug: String(match.tournaments?.slug ?? ""),
    tournamentSport: String(match.tournaments?.sport ?? ""),
    tournamentStatus: String(match.tournaments?.status ?? ""),
    scheduledAt: match.scheduled_at ? String(match.scheduled_at) : null,
    roundLabel: match.round_label ? String(match.round_label) : null,
    liveMinute: match.live_minute != null ? Number(match.live_minute) : null,
    status: String(match.status ?? "scheduled"),
    home,
    away,
    homeScore,
    awayScore,
    scoreText,
  };
}

