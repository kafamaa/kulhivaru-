import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { getPublicTournamentTeams } from "@/src/features/tournaments/queries/get-public-tournament-teams";

export type TournamentTeamsStatusFilter =
  | "all"
  | "leading"
  | "qualified"
  | "eliminated"
  | "active";

export type TournamentTeamsSort = "rank" | "points" | "played";

export interface TournamentTeamsGroupOption {
  key: string; // "overall" or group_id string
  label: string;
}

export interface TournamentTeamDirectoryRow {
  teamId: string;
  teamName: string;
  teamLogoUrl: string | null;
  entryStatus: "pending" | "approved" | "rejected";

  // Standing context (from standings_cache)
  groupId: string | null;
  rank: number | null;
  points: number;
  played: number;

  // MVP-derived from match results
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  cleanSheets: number;

  // Live context
  isPlayingNow: boolean;

  // Derived status for filtering
  derivedStatus: "leading" | "qualified" | "eliminated" | "active" | "unranked";
}

export interface TournamentTeamsDirectoryResult {
  tournament: {
    id: string;
    slug: string;
    name: string;
    status: string;
    sport: string;
    location: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    organizerName: string | null;
  };

  groups: TournamentTeamsGroupOption[];

  summary: {
    totalTeams: number;
    activeTeams: number; // played > 0
    rankedTeams: number; // rank != null
  };

  spotlight: Array<{
    teamId: string;
    teamName: string;
    teamLogoUrl: string | null;
    reason: string;
    points: number;
  }>;

  teams: TournamentTeamDirectoryRow[];

  total: number;
  page: number;
  limit: number;
}

function normalizeGroupKeyToGroupId(groupKey?: string | null) {
  if (groupKey == null) return null;
  if (groupKey === "overall") return null;
  return groupKey;
}

function derivedZone(row: Pick<TournamentTeamDirectoryRow, "rank" | "played">) {
  if (row.rank == null) return "unranked" as const;
  if (row.rank === 1) return "leading" as const;
  if (row.rank <= 2) return "qualified" as const;
  return "eliminated" as const;
}

export async function getPublicTournamentTeamsDirectory(input: {
  slug: string;
  page: number;
  limit: number;
  q?: string | null;
  groupKey?: string | null; // overall or group_id
  status: TournamentTeamsStatusFilter;
  sort: TournamentTeamsSort;
}): Promise<TournamentTeamsDirectoryResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, input.page);
  const limit = Math.max(1, Math.min(24, input.limit));

  const tournamentRes = await supabase
    .from("public_tournaments")
    .select(
      "id, slug, name, sport, location, status, logo_url, cover_image_url, organizer_name"
    )
    .eq("slug", input.slug)
    .single();

  const { data: tournamentRow, error: tournamentErr } = tournamentRes;
  if (tournamentErr || !tournamentRow) throw new Error("Tournament not found.");

  const tournament = {
    id: String(tournamentRow.id),
    slug: String(tournamentRow.slug),
    name: String(tournamentRow.name),
    status: String(tournamentRow.status),
    sport: String(tournamentRow.sport),
    location: (tournamentRow.location as string | null) ?? null,
    logoUrl: (tournamentRow.logo_url as string | null) ?? null,
    bannerUrl: (tournamentRow.cover_image_url as string | null) ?? null,
    organizerName: (tournamentRow.organizer_name as string | null) ?? null,
  };

  // Base team list (approved)
  const teamsBase = (await getPublicTournamentTeams(input.slug)).filter(
    (t) => t.entryStatus === "approved"
  );

  const groupIdFilter = normalizeGroupKeyToGroupId(input.groupKey);

  // Groups from standings_cache
  const { data: standingsGroupRows } = await supabase
    .from("standings_cache")
    .select("group_id")
    .eq("tournament_id", tournament.id);

  const groupIds = new Set<string>();
  for (const r of (standingsGroupRows ?? []) as Array<{ group_id: string | null }>) {
    if (r.group_id) groupIds.add(String(r.group_id));
  }

  const groups: TournamentTeamsGroupOption[] = [
    { key: "overall", label: "Overall" },
    ...Array.from(groupIds)
      .sort((a, b) => a.localeCompare(b))
      .map((gid) => ({ key: gid, label: `Group ${gid.slice(0, 6)}` })),
  ];

  // Standings per team for selected group context (MVP: group_id often NULL)
  let standingsQuery = supabase
    .from("standings_cache")
    .select("team_id, rank, points, played, group_id")
    .eq("tournament_id", tournament.id);

  if (groupIdFilter === null) standingsQuery = standingsQuery.is("group_id", null);
  else standingsQuery = standingsQuery.eq("group_id", groupIdFilter);

  const { data: standingsRows, error: standingsErr } = await standingsQuery;
  if (standingsErr) throw new Error(standingsErr.message);

  const standingsByTeamId = new Map<
    string,
    {
      rank: number | null;
      points: number;
      played: number;
      groupId: string | null;
    }
  >();

  for (const r of (standingsRows ?? []) as Array<{
    team_id: string;
    rank: number | null;
    points: number | null;
    played: number | null;
    group_id: string | null;
  }>) {
    const tid = String(r.team_id);
    standingsByTeamId.set(tid, {
      rank: r.rank == null ? null : Number(r.rank),
      points: Number(r.points ?? 0),
      played: Number(r.played ?? 0),
      groupId: r.group_id == null ? null : String(r.group_id),
    });
  }

  const teamIds = teamsBase.map((t) => t.teamId);

  // Compute W/D/L + GF/GA + clean sheets + live flags from match results
  const { data: finishedMatchesRows, error: finishedMatchesErr } = await supabase
    .from("matches")
    .select("id, home_team_id, away_team_id, home_score, away_score")
    .eq("tournament_id", tournament.id)
    .in("status", ["ft", "completed"]);

  if (finishedMatchesErr) throw new Error(finishedMatchesErr.message);

  const { data: liveMatchesRows, error: liveMatchesErr } = await supabase
    .from("matches")
    .select("id, home_team_id, away_team_id")
    .eq("tournament_id", tournament.id)
    .eq("status", "live");
  if (liveMatchesErr) throw new Error(liveMatchesErr.message);

  const teamStat = new Map<
    string,
    {
      wins: number;
      draws: number;
      losses: number;
      gf: number;
      ga: number;
      cleanSheets: number;
      playedFromResults: number;
    }
  >();
  for (const tid of teamIds) {
    teamStat.set(tid, { wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, cleanSheets: 0, playedFromResults: 0 });
  }

  const teamSet = new Set(teamIds);

  for (const m of (finishedMatchesRows ?? []) as Array<{
    home_team_id: string | null;
    away_team_id: string | null;
    home_score: number | null;
    away_score: number | null;
  }>) {
    const homeId = m.home_team_id ? String(m.home_team_id) : null;
    const awayId = m.away_team_id ? String(m.away_team_id) : null;
    if (!homeId || !awayId) continue;
    if (!teamSet.has(homeId) || !teamSet.has(awayId)) continue;
    if (m.home_score == null || m.away_score == null) continue;

    const hs = Number(m.home_score);
    const as = Number(m.away_score);

    const homeStat = teamStat.get(homeId);
    const awayStat = teamStat.get(awayId);
    if (!homeStat || !awayStat) continue;

    homeStat.playedFromResults += 1;
    awayStat.playedFromResults += 1;

    homeStat.gf += hs;
    homeStat.ga += as;
    awayStat.gf += as;
    awayStat.ga += hs;

    if (hs > as) {
      homeStat.wins += 1;
      awayStat.losses += 1;
    } else if (hs < as) {
      awayStat.wins += 1;
      homeStat.losses += 1;
    } else {
      homeStat.draws += 1;
      awayStat.draws += 1;
    }

    // Clean sheet = opponent scored 0
    if (as === 0) homeStat.cleanSheets += 1;
    if (hs === 0) awayStat.cleanSheets += 1;
  }

  const liveTeamIds = new Set<string>();
  for (const m of (liveMatchesRows ?? []) as Array<{
    home_team_id: string | null;
    away_team_id: string | null;
  }>) {
    if (m.home_team_id) liveTeamIds.add(String(m.home_team_id));
    if (m.away_team_id) liveTeamIds.add(String(m.away_team_id));
  }

  // Merge into directory rows
  const rows: TournamentTeamDirectoryRow[] = teamsBase.map((t) => {
    const standings = standingsByTeamId.get(t.teamId);
    const stat = teamStat.get(t.teamId);

    const rank = standings?.rank ?? null;
    const points = standings?.points ?? 0;
    const played = standings?.played ?? (stat?.playedFromResults ?? 0);
    const wins = stat?.wins ?? 0;
    const draws = stat?.draws ?? 0;
    const losses = stat?.losses ?? 0;
    const goalsFor = stat?.gf ?? 0;
    const goalsAgainst = stat?.ga ?? 0;
    const goalDifference = goalsFor - goalsAgainst;
    const cleanSheets = stat?.cleanSheets ?? 0;
    const isPlayingNow = liveTeamIds.has(t.teamId);

    const derivedStatus = (() => {
      const zone = derivedZone({ rank, played });
      if (zone !== "unranked") return zone;
      // If no rank but team has played, show active.
      if (played > 0) return "active";
      return "unranked";
    })();

    return {
      teamId: t.teamId,
      teamName: t.teamName,
      teamLogoUrl: t.teamLogoUrl,
      entryStatus: t.entryStatus,
      groupId: standings?.groupId ?? null,
      rank,
      points,
      played,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference,
      cleanSheets,
      isPlayingNow,
      derivedStatus,
    };
  });

  const q = input.q?.trim().toLowerCase() ?? "";
  let filtered = rows;
  if (q) filtered = filtered.filter((r) => r.teamName.toLowerCase().includes(q));

  if (input.status !== "all") {
    if (input.status === "leading") filtered = filtered.filter((r) => r.derivedStatus === "leading");
    if (input.status === "qualified") filtered = filtered.filter((r) => r.derivedStatus === "qualified");
    if (input.status === "eliminated") filtered = filtered.filter((r) => r.derivedStatus === "eliminated");
    if (input.status === "active") filtered = filtered.filter((r) => r.played > 0);
  }

  // Sorting
  const byRank = (a: TournamentTeamDirectoryRow, b: TournamentTeamDirectoryRow) => {
    const ar = a.rank ?? 999999;
    const br = b.rank ?? 999999;
    if (ar !== br) return ar - br;
    if (b.points !== a.points) return b.points - a.points;
    return b.played - a.played;
  };

  const byPoints = (a: TournamentTeamDirectoryRow, b: TournamentTeamDirectoryRow) => {
    if (b.points !== a.points) return b.points - a.points;
    return byRank(a, b);
  };

  const byPlayed = (a: TournamentTeamDirectoryRow, b: TournamentTeamDirectoryRow) => {
    if (b.played !== a.played) return b.played - a.played;
    return byRank(a, b);
  };

  if (input.sort === "rank") filtered = filtered.slice().sort(byRank);
  if (input.sort === "points") filtered = filtered.slice().sort(byPoints);
  if (input.sort === "played") filtered = filtered.slice().sort(byPlayed);

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const pagedTeams = filtered.slice(offset, offset + limit);

  const activeTeams = rows.filter((r) => r.played > 0).length;
  const rankedTeams = rows.filter((r) => r.rank != null).length;

  // Spotlight: top 2 by points (then rank)
  const spotlightSource = rows.slice().sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if ((a.rank ?? 999999) !== (b.rank ?? 999999)) return (a.rank ?? 999999) - (b.rank ?? 999999);
    return b.played - a.played;
  });

  const spotlight = spotlightSource.slice(0, 2).map((r, idx) => ({
    teamId: r.teamId,
    teamName: r.teamName,
    teamLogoUrl: r.teamLogoUrl,
    reason: idx === 0 ? "League leaders" : "In the top contention",
    points: r.points,
  }));

  return {
    tournament,
    groups,
    summary: {
      totalTeams: rows.length,
      activeTeams,
      rankedTeams,
    },
    spotlight,
    teams: pagedTeams,
    total,
    page,
    limit,
  };
}

