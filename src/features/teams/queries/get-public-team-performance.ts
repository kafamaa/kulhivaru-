import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface TeamPerformanceStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

function computePoints(isWin: boolean, isDraw: boolean) {
  if (isWin) return 3;
  if (isDraw) return 1;
  return 0;
}

export async function getPublicTeamPerformance(input: {
  teamId: string;
}): Promise<TeamPerformanceStats> {
  const supabase = await createSupabaseServerClient();

  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      "status,home_team_id,away_team_id,home_score,away_score"
    )
    .or(`home_team_id.eq.${input.teamId},away_team_id.eq.${input.teamId}`)
    .in("status", ["ft", "completed"]);

  if (error || !matches) {
    return {
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    };
  }

  let matchesPlayed = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let points = 0;

  for (const m of matches as any[]) {
    const homeId = m.home_team_id ? String(m.home_team_id) : null;
    const awayId = m.away_team_id ? String(m.away_team_id) : null;
    if (homeId !== input.teamId && awayId !== input.teamId) continue;

    const homeScore = m.home_score != null ? Number(m.home_score) : null;
    const awayScore = m.away_score != null ? Number(m.away_score) : null;
    if (homeScore == null || awayScore == null) continue;

    const isHome = homeId === input.teamId;
    const teamGoals = isHome ? homeScore : awayScore;
    const oppGoals = isHome ? awayScore : homeScore;

    goalsFor += teamGoals;
    goalsAgainst += oppGoals;
    matchesPlayed += 1;

    const isWin = teamGoals > oppGoals;
    const isDraw = teamGoals === oppGoals;
    if (isWin) wins += 1;
    else if (isDraw) draws += 1;
    else losses += 1;

    points += computePoints(isWin, isDraw);
  }

  return {
    matchesPlayed,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    points,
  };
}

