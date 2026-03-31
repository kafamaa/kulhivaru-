import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface NearbyStandingTeam {
  teamId: string;
  teamName: string;
  rank: number;
  points: number;
  played: number;
}

export interface TeamStandingsSnapshot {
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  tournamentSport: string;
  tournamentStatus: string;

  groupName: string;
  rank: number;
  points: number;
  played: number;
  goalDifference: number;

  nearbyTeams: NearbyStandingTeam[];
}

export async function getPublicTeamStandingsSnapshot(input: {
  teamId: string;
  tournamentIds: string[];
}): Promise<TeamStandingsSnapshot[]> {
  const supabase = await createSupabaseServerClient();
  if (input.tournamentIds.length === 0) return [];

  const { data: myRows, error: myRowError } = await supabase
    .from("standings_cache")
    .select("tournament_id,rank,points,played,group_id")
    .eq("team_id", input.teamId)
    .in("tournament_id", input.tournamentIds);

  if (myRowError || !myRows) return [];

  // Goal difference per tournament from finished matches
  const { data: finishedMatches } = await supabase
    .from("matches")
    .select(
      "id,tournament_id,status,home_team_id,away_team_id,home_score,away_score"
    )
    .eq("status", "ft")
    .in("tournament_id", input.tournamentIds);

  // Note: project also uses 'completed', so we also include that.
  const { data: finishedMatches2 } = await supabase
    .from("matches")
    .select(
      "id,tournament_id,status,home_team_id,away_team_id,home_score,away_score"
    )
    .eq("status", "completed")
    .in("tournament_id", input.tournamentIds);

  const allFinished = [
    ...(finishedMatches ?? []),
    ...(finishedMatches2 ?? []),
  ] as any[];

  const gdByTournament = new Map<string, number>();
  for (const m of allFinished) {
    const tid = String(m.tournament_id);
    const homeId = m.home_team_id ? String(m.home_team_id) : null;
    const awayId = m.away_team_id ? String(m.away_team_id) : null;
    const homeScore = m.home_score != null ? Number(m.home_score) : null;
    const awayScore = m.away_score != null ? Number(m.away_score) : null;
    if (homeScore == null || awayScore == null) continue;
    if (homeId === input.teamId) {
      gdByTournament.set(tid, (gdByTournament.get(tid) ?? 0) + (homeScore - awayScore));
    } else if (awayId === input.teamId) {
      gdByTournament.set(tid, (gdByTournament.get(tid) ?? 0) + (awayScore - homeScore));
    }
  }

  // Nearby teams around rank
  // (MVP: group_id is often NULL, but we respect it if present)
  const snapshots: TeamStandingsSnapshot[] = [];

  // Fetch tournaments for names + slugs
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id,name,slug,sport,status")
    .in("id", input.tournamentIds);
  const tournamentById = new Map<string, any>(
    (tournaments ?? []).map((t: any) => [String(t.id), t])
  );

  const teamIdsNeeded = new Set<string>();

  for (const r of myRows as any[]) {
    const tid = String(r.tournament_id);
    const rank = Number(r.rank);
    const groupId = r.group_id as string | null;
    const rankMin = Math.max(1, rank - 2);
    const rankMax = rank + 2;

    const { data: nearby } = await supabase
      .from("standings_cache")
      .select("team_id,rank,points,played,group_id,teams(name)")
      .eq("tournament_id", tid)
      .eq("group_id", groupId)
      .gte("rank", rankMin)
      .lte("rank", rankMax);

    const gd = gdByTournament.get(tid) ?? 0;
    const t = tournamentById.get(tid);
    const groupName = groupId ? `Group ${String(groupId).slice(0, 6)}` : "Overall";

    snapshots.push({
      tournamentId: tid,
      tournamentName: String(t?.name ?? "Tournament"),
      tournamentSlug: String(t?.slug ?? ""),
      tournamentSport: String(t?.sport ?? ""),
      tournamentStatus: String(t?.status ?? ""),

      groupName,
      rank,
      points: Number(r.points ?? 0),
      played: Number(r.played ?? 0),
      goalDifference: gd,
      nearbyTeams: (nearby ?? [])
        .filter((nr: any) => String(nr.team_id) !== input.teamId)
        .map((nr: any) => ({
          teamId: String(nr.team_id),
          teamName: String(nr.teams?.name ?? "Team"),
          rank: Number(nr.rank ?? 0),
          points: Number(nr.points ?? 0),
          played: Number(nr.played ?? 0),
        })),
    });

    for (const nr of nearby ?? []) {
      if (nr.team_id) teamIdsNeeded.add(String(nr.team_id));
    }
  }

  return snapshots.sort((a, b) => a.tournamentName.localeCompare(b.tournamentName));
}

