import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type TournamentStandingsPhaseKey =
  | "group-stage"
  | "knockout"
  | "finals";

export interface PublicStandingsRow {
  rank: number;
  teamId: string;
  teamName: string;
  logoUrl: string | null;

  played: number;
  wins: number;
  draws: number;
  losses: number;

  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;

  points: number;

  groupId: string | null;
}

export interface TournamentStandingsQueryInput {
  slug: string;
  phase?: TournamentStandingsPhaseKey; // MVP: not currently used (no phase/group columns on matches)
  groupId?: string | null; // "overall" maps to null
}

export interface TournamentStandingsResult {
  tournament: {
    id: string;
    slug: string;
    name: string;
    sport: string;
    status: string;
    location: string | null;
    logoUrl: string | null;
  };
  groupOptions: Array<{ key: string; label: string }>; // includes "overall"
  phaseOptions: Array<{ key: TournamentStandingsPhaseKey; label: string }>;
  rows: PublicStandingsRow[];
}

function normalizeGroupKeyToGroupId(groupKey?: string | null): string | null | undefined {
  if (groupKey == null) return undefined;
  if (groupKey === "overall") return null;
  return groupKey;
}

export async function getPublicTournamentStandings(
  input: TournamentStandingsQueryInput
): Promise<TournamentStandingsResult> {
  const supabase = await createSupabaseServerClient();

  const { data: tRow, error: tErr } = await supabase
    .from("public_tournaments")
    .select(
      "id, slug, name, sport, status, location, logo_url"
    )
    .eq("slug", input.slug)
    .single();

  if (tErr || !tRow) {
    throw new Error("Tournament not found.");
  }

  const tournamentId = String(tRow.id);

  // Pull cached ranks/points
  const groupId = normalizeGroupKeyToGroupId(input.groupId);

  let groupRowsQuery = supabase
    .from("standings_cache")
    .select("rank, points, played, group_id, team_id")
    .eq("tournament_id", tournamentId);

  if (groupId !== undefined) {
    // explicit filter; groupId can be null
    if (groupId === null) {
      groupRowsQuery = groupRowsQuery.is("group_id", null);
    } else {
      groupRowsQuery = groupRowsQuery.eq("group_id", groupId);
    }
  }

  const { data: cachedRows, error: cachedErr } = await groupRowsQuery.order(
    "rank",
    { ascending: true }
  );

  if (cachedErr) {
    throw new Error(cachedErr.message);
  }

  const cached = (cachedRows ?? []) as Array<{
    rank: number | null;
    team_id: string | null;
    points: number | null;
    played: number | null;
    group_id: string | null;
  }>;

  const teamIds = Array.from(
    new Set(cached.map((r) => String(r.team_id)).filter(Boolean))
  );

  const { data: teamsRows } = teamIds.length
    ? await supabase
        .from("teams")
        .select("id, name, logo_url")
        .in("id", teamIds)
    : { data: [] };

  const teamById = new Map<string, any>(
    (teamsRows ?? []).map((t: any) => [String(t.id), t])
  );

  // Compute W/D/L and GF/GA from finished matches (MVP fallback)
  const { data: matchesRows, error: matchesErr } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id, home_score, away_score")
    .eq("tournament_id", tournamentId)
    .in("status", ["ft", "completed"]);

  if (matchesErr) {
    throw new Error(matchesErr.message);
  }

  const teamSet = new Set(teamIds);
  const statByTeamId = new Map<
    string,
    { wins: number; draws: number; losses: number; gf: number; ga: number }
  >();

  for (const tid of teamIds) {
    statByTeamId.set(tid, { wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 });
  }

  for (const m of (matchesRows ?? []) as Array<{
    home_team_id: string | null;
    away_team_id: string | null;
    home_score: number | null;
    away_score: number | null;
  }>) {
    if (!m.home_team_id || !m.away_team_id) continue;
    if (!teamSet.has(String(m.home_team_id)) || !teamSet.has(String(m.away_team_id)))
      continue;
    if (m.home_score == null || m.away_score == null) continue;

    const homeId = String(m.home_team_id);
    const awayId = String(m.away_team_id);

    const homeStat =
      statByTeamId.get(homeId) ?? { wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
    const awayStat =
      statByTeamId.get(awayId) ?? { wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };

    homeStat.gf += Number(m.home_score);
    homeStat.ga += Number(m.away_score);
    awayStat.gf += Number(m.away_score);
    awayStat.ga += Number(m.home_score);

    if (m.home_score > m.away_score) {
      homeStat.wins += 1;
      awayStat.losses += 1;
    } else if (m.home_score < m.away_score) {
      awayStat.wins += 1;
      homeStat.losses += 1;
    } else {
      homeStat.draws += 1;
      awayStat.draws += 1;
    }

    statByTeamId.set(homeId, homeStat);
    statByTeamId.set(awayId, awayStat);
  }

  // Group options from cached rows
  const groupIdsDistinct = new Set<string | null>(
    cached.map((r) => r.group_id ?? null)
  );

  const groupOptions = [
    { key: "overall", label: "Overall" },
    ...Array.from(groupIdsDistinct)
      .filter((gid) => gid != null)
      .map((gid) => {
        const s = String(gid);
        return { key: s, label: `Group ${s}` };
      }),
  ];

  // MVP phase options
  const phaseOptions: TournamentStandingsResult["phaseOptions"] = [
    { key: "group-stage", label: "Group Stage" },
    { key: "knockout", label: "Knockout" },
    { key: "finals", label: "Finals" },
  ];

  const rows: PublicStandingsRow[] = cached
    .map((r) => {
      const team = teamById.get(String(r.team_id));
      const stat = statByTeamId.get(String(r.team_id));

      return {
        rank: Number(r.rank ?? 0),
        teamId: String(r.team_id),
        teamName: String(team?.name ?? "Team"),
        logoUrl: (team?.logo_url as string | null) ?? null,
        groupId: (r.group_id as string | null) ?? null,

        played: Number(r.played ?? 0),
        wins: stat?.wins ?? 0,
        draws: stat?.draws ?? 0,
        losses: stat?.losses ?? 0,

        goalsFor: stat?.gf ?? 0,
        goalsAgainst: stat?.ga ?? 0,
        goalDifference: (stat?.gf ?? 0) - (stat?.ga ?? 0),

        points: Number(r.points ?? 0),
      };
    })
    .sort((a, b) => a.rank - b.rank);

  return {
    tournament: {
      id: String(tRow.id),
      slug: String(tRow.slug),
      name: String(tRow.name),
      sport: String(tRow.sport),
      status: String(tRow.status),
      location: (tRow.location as string | null) ?? null,
      logoUrl: (tRow.logo_url as string | null) ?? null,
    },
    groupOptions,
    phaseOptions,
    rows,
  };
}

