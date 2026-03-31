import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { parseFixtureContextFromRoundLabel } from "@/src/features/matches/lib/parse-fixture-context";

export type TournamentStatsTab =
  | "top-scorers"
  | "assists"
  | "clean-sheets"
  | "cards"
  | "team-stats";

export interface TournamentStatsFilters {
  // MVP: derived from `matches.round_label` via heuristic.
  phaseKey?: string | null; // "group-stage", "quarter-finals", etc.
  groupKey?: string | null; // "A", "B", etc or null for overall
  // Category exists in your wizard, but current MVP matches don't include category refs.
  category?: string | null;
}

export interface TournamentStatsSummary {
  totalMatches: number;
  playedMatches: number;
  totalGoals: number;
  totalPlayers: number;
}

export interface PlayerLeaderboardRow {
  playerId: string;
  playerName: string;
  playerImageUrl: string | null;
  teamId: string | null;
  teamName: string;
  teamLogoUrl: string | null;

  // stat columns (depending on tab)
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number; // matches where player recorded relevant stat
}

export interface TeamLeaderboardRow {
  teamId: string;
  teamName: string;
  teamLogoUrl: string | null;

  matchesPlayed: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  cleanSheets: number;
}

export interface TournamentStatsSpotlight {
  topScorer: {
    playerId: string;
    playerName: string;
    teamName: string;
    goals: number;
  } | null;
  topAssist: {
    playerId: string;
    playerName: string;
    teamName: string;
    assists: number;
  } | null;
  bestTeam: {
    teamId: string;
    teamName: string;
    points: number;
  } | null;
}

export interface TournamentStatsPhaseOption {
  key: string;
  label: string;
}

export interface TournamentStatsGroupOption {
  key: string;
  label: string;
}

export interface TournamentStatsPayload {
  tournament: {
    id: string;
    slug: string;
    name: string;
    sport: string;
    location: string | null;
    status: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    organizerName: string | null;
  };

  phaseOptions: TournamentStatsPhaseOption[];
  groupOptions: TournamentStatsGroupOption[];

  summary: TournamentStatsSummary;
  spotlight: TournamentStatsSpotlight;

  playerLeaderboard: PlayerLeaderboardRow[];
  teamLeaderboard: TeamLeaderboardRow[];

  activeTab: TournamentStatsTab;
}

function formatKeyOrder(keys: string[]) {
  const map = new Map<string, number>();
  keys.forEach((k, i) => map.set(k, i));
  return map;
}

function phaseKeyOrder() {
  return formatKeyOrder([
    "group-stage",
    "quarter-finals",
    "semi-finals",
    "final",
    "custom",
    "unknown",
  ]);
}

function derivePhaseAndGroupFromMatch(m: {
  round_label: string | null;
}) {
  const parsed = parseFixtureContextFromRoundLabel(m.round_label);
  return {
    phaseKey: parsed.phaseKey,
    phaseLabel: parsed.phaseLabel,
    groupKey: parsed.groupKey,
    groupLabel: parsed.groupLabel,
  };
}

function incMap<K>(map: Map<K, number>, key: K, by: number) {
  map.set(key, (map.get(key) ?? 0) + by);
}

export async function getPublicTournamentStats(input: {
  slug: string;
  tab: TournamentStatsTab;
  filters: TournamentStatsFilters;
  limit?: number;
}): Promise<TournamentStatsPayload> {
  const supabase = await createSupabaseServerClient();
  const limit = input.limit ?? 10;

  const { data: tRow, error: tErr } = await supabase
    .from("public_tournaments")
    .select("id, slug, name, sport, location, status, logo_url, cover_image_url, organizer_name")
    .eq("slug", input.slug)
    .single();

  if (tErr || !tRow) throw new Error("Tournament not found.");

  const tournament = {
    id: String(tRow.id),
    slug: String(tRow.slug),
    name: String(tRow.name),
    sport: String(tRow.sport),
    location: (tRow.location as string | null) ?? null,
    status: String(tRow.status),
    logoUrl: (tRow.logo_url as string | null) ?? null,
    bannerUrl: (tRow.cover_image_url as string | null) ?? null,
    organizerName: (tRow.organizer_name as string | null) ?? null,
  };

  const phaseFilter = input.filters.phaseKey ?? null;
  const groupFilter = input.filters.groupKey ?? null;
  // groupFilter "overall" should become null for our internal groupKey usage.
  const normalizedGroupFilter = groupFilter === "overall" ? null : groupFilter;

  // Fetch finished matches (for reliable final stats).
  const { data: matchesRows, error: matchesErr } = await supabase
    .from("matches")
    .select(
      "id, status, scheduled_at, round_label, live_minute, home_team_id, away_team_id, home_score, away_score"
    )
    .eq("tournament_id", tournament.id)
    .in("status", ["ft", "completed"]);

  if (matchesErr) throw new Error(matchesErr.message);

  const matches = (matchesRows ?? []) as Array<{
    id: string;
    status: string;
    round_label: string | null;
    home_team_id: string | null;
    away_team_id: string | null;
    home_score: number | null;
    away_score: number | null;
  }>;

  // Phase/group extraction + filters
  const matchMetaById = new Map<
    string,
    {
      phaseKey: string;
      phaseLabel: string;
      groupKey: string;
      groupLabel: string;
    }
  >();

  const phaseSet = new Map<string, string>();
  const groupSet = new Map<string, string>();

  for (const m of matches) {
    const { phaseKey, phaseLabel, groupKey, groupLabel } = derivePhaseAndGroupFromMatch(m);
    matchMetaById.set(String(m.id), { phaseKey, phaseLabel, groupKey, groupLabel });
    phaseSet.set(phaseKey, phaseLabel);
    groupSet.set(groupKey, groupLabel);
  }

  const phaseOrder = phaseKeyOrder();
  const phaseOptions = Array.from(phaseSet.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => (phaseOrder.get(a.key) ?? 999) - (phaseOrder.get(b.key) ?? 999));

  const groupOptions = Array.from(groupSet.entries())
    .filter(([key]) => key !== "overall")
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.key.localeCompare(b.key));

  // Apply phase/group filters on matches.
  const filteredMatchIds: string[] = [];
  for (const m of matches) {
    const mid = String(m.id);
    const meta = matchMetaById.get(mid);
    if (!meta) continue;
    if (phaseFilter && meta.phaseKey !== phaseFilter) continue;
    if (normalizedGroupFilter && meta.groupKey !== normalizedGroupFilter) continue;
    filteredMatchIds.push(mid);
  }

  const playedMatches = filteredMatchIds.length;
  const totalMatches = matches.length;

  const filteredMatchIdSet = new Set(filteredMatchIds);
  const matchTeamIdSet = new Set<string>();
  for (const m of matches) {
    const mid = String(m.id);
    if (!filteredMatchIdSet.has(mid)) continue;
    if (m.home_team_id) matchTeamIdSet.add(String(m.home_team_id));
    if (m.away_team_id) matchTeamIdSet.add(String(m.away_team_id));
  }

  // Fetch match events for filtered matches.
  const goalTypes = ["goal", "assist", "yellow_card", "red_card"];

  const { data: eventRows, error: eventsErr } = filteredMatchIds.length
    ? await supabase
        .from("match_events")
        .select("event_type, player_id, match_id")
        .in("match_id", filteredMatchIds)
        .in("event_type", goalTypes)
    : { data: [], error: null };

  if (eventsErr) throw new Error(eventsErr.message);

  const events = (eventRows ?? []) as Array<{
    event_type: string;
    player_id: string | null;
    match_id: string;
  }>;

  const playerIds = Array.from(new Set(events.map((e) => (e.player_id ? String(e.player_id) : null)).filter(Boolean))) as string[];

  const { data: playersRows, error: playersErr } = playerIds.length
    ? await supabase
        .from("players")
        .select("id, name, image_url, team_id")
        .in("id", playerIds)
    : { data: [], error: null };

  if (playersErr) throw new Error(playersErr.message);

  const players = (playersRows ?? []) as Array<{
    id: string;
    name: string;
    image_url: string | null;
    team_id: string | null;
  }>;

  const playerTeamIds = Array.from(new Set(players.map((p) => p.team_id).filter(Boolean))) as string[];
  const teamIds = Array.from(new Set([...playerTeamIds, ...Array.from(matchTeamIdSet)]));

  const { data: teamsRows, error: teamsErr } = teamIds.length
    ? await supabase
        .from("teams")
        .select("id, name, logo_url")
        .in("id", teamIds)
    : { data: [], error: null };

  if (teamsErr) throw new Error(teamsErr.message);

  const teams = (teamsRows ?? []) as Array<{
    id: string;
    name: string;
    logo_url: string | null;
  }>;

  const playerById = new Map<string, { name: string; imageUrl: string | null; teamId: string | null }>(
    players.map((p) => [
      String(p.id),
      { name: String(p.name), imageUrl: (p.image_url as string | null) ?? null, teamId: p.team_id ? String(p.team_id) : null },
    ])
  );
  const teamById = new Map<string, { name: string; logoUrl: string | null }>(
    teams.map((t) => [
      String(t.id),
      { name: String(t.name), logoUrl: (t.logo_url as string | null) ?? null },
    ])
  );

  // Aggregate player stats
  const goalsByPlayer = new Map<string, number>();
  const assistsByPlayer = new Map<string, number>();
  const yellowByPlayer = new Map<string, number>();
  const redByPlayer = new Map<string, number>();
  const goalMatchesByPlayer = new Map<string, Set<string>>();
  const assistMatchesByPlayer = new Map<string, Set<string>>();
  const cardMatchesByPlayer = new Map<string, Set<string>>();

  for (const e of events) {
    if (!e.player_id) continue;
    const pid = String(e.player_id);
    const mid = String(e.match_id);
    if (e.event_type === "goal") {
      incMap(goalsByPlayer, pid, 1);
      if (!goalMatchesByPlayer.has(pid)) goalMatchesByPlayer.set(pid, new Set());
      goalMatchesByPlayer.get(pid)!.add(mid);
    } else if (e.event_type === "assist") {
      incMap(assistsByPlayer, pid, 1);
      if (!assistMatchesByPlayer.has(pid)) assistMatchesByPlayer.set(pid, new Set());
      assistMatchesByPlayer.get(pid)!.add(mid);
    } else if (e.event_type === "yellow_card") {
      incMap(yellowByPlayer, pid, 1);
      if (!cardMatchesByPlayer.has(pid)) cardMatchesByPlayer.set(pid, new Set());
      cardMatchesByPlayer.get(pid)!.add(mid);
    } else if (e.event_type === "red_card") {
      incMap(redByPlayer, pid, 1);
      if (!cardMatchesByPlayer.has(pid)) cardMatchesByPlayer.set(pid, new Set());
      cardMatchesByPlayer.get(pid)!.add(mid);
    }
  }

  const totalGoals = Array.from(goalsByPlayer.values()).reduce((a, b) => a + b, 0);
  const totalPlayers = playerIds.length;

  // Aggregate team stats
  const teamStatMap = new Map<
    string,
    {
      matchesPlayed: Set<string>;
      points: number;
      goalsFor: number;
      goalsAgainst: number;
      cleanSheets: number;
    }
  >();

  const filteredMatches = matches.filter((m) => filteredMatchIdSet.has(String(m.id)));
  for (const m of filteredMatches) {
    const mid = String(m.id);
    const homeId = m.home_team_id ? String(m.home_team_id) : null;
    const awayId = m.away_team_id ? String(m.away_team_id) : null;

    const homeScore = m.home_score != null ? Number(m.home_score) : null;
    const awayScore = m.away_score != null ? Number(m.away_score) : null;
    if (!homeId || !awayId) continue;
    if (homeScore == null || awayScore == null) continue;

    const upsertTeam = (tid: string) => {
      if (!teamStatMap.has(tid)) {
        teamStatMap.set(tid, {
          matchesPlayed: new Set<string>(),
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          cleanSheets: 0,
        });
      }
      teamStatMap.get(tid)!.matchesPlayed.add(mid);
    };

    upsertTeam(homeId);
    upsertTeam(awayId);

    teamStatMap.get(homeId)!.goalsFor += homeScore;
    teamStatMap.get(homeId)!.goalsAgainst += awayScore;
    teamStatMap.get(awayId)!.goalsFor += awayScore;
    teamStatMap.get(awayId)!.goalsAgainst += homeScore;

    // Points
    if (homeScore > awayScore) {
      teamStatMap.get(homeId)!.points += 3;
    } else if (homeScore < awayScore) {
      teamStatMap.get(awayId)!.points += 3;
    } else {
      teamStatMap.get(homeId)!.points += 1;
      teamStatMap.get(awayId)!.points += 1;
    }

    // Clean sheets: team concedes 0
    if (awayScore === 0) {
      teamStatMap.get(homeId)!.cleanSheets += 1;
    }
    if (homeScore === 0) {
      teamStatMap.get(awayId)!.cleanSheets += 1;
    }
  }

  const teamLeaderboard = Array.from(teamStatMap.entries()).map(([teamId, v]) => {
    const teamMeta = teamById.get(teamId);
    return {
      teamId,
      teamName: teamMeta?.name ?? "Team",
      teamLogoUrl: teamMeta?.logoUrl ?? null,
      matchesPlayed: v.matchesPlayed.size,
      points: v.points,
      goalsFor: v.goalsFor,
      goalsAgainst: v.goalsAgainst,
      goalDifference: v.goalsFor - v.goalsAgainst,
      cleanSheets: v.cleanSheets,
    };
  });

  teamLeaderboard.sort((a, b) => {
    // Default: points, then goal difference, then goals for
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  // Player leaderboard (computed aggregate across all players, then pick depending on tab)
  const allPlayerIds = Array.from(
    new Set([
      ...Array.from(goalsByPlayer.keys()),
      ...Array.from(assistsByPlayer.keys()),
      ...Array.from(yellowByPlayer.keys()),
      ...Array.from(redByPlayer.keys()),
    ])
  );

  const playerLeaderboardFull: PlayerLeaderboardRow[] = allPlayerIds.map((pid) => {
    const p = playerById.get(pid);
    const tid = p?.teamId ?? null;
    const teamMeta = tid ? teamById.get(tid) : undefined;

    const goals = goalsByPlayer.get(pid) ?? 0;
    const assists = assistsByPlayer.get(pid) ?? 0;
    const yellowCards = yellowByPlayer.get(pid) ?? 0;
    const redCards = redByPlayer.get(pid) ?? 0;

    const matchesPlayed =
      // Use the most relevant match count based on whichever stat is non-zero.
      goals > 0 ? (goalMatchesByPlayer.get(pid)?.size ?? 0)
      : assists > 0 ? (assistMatchesByPlayer.get(pid)?.size ?? 0)
      : (cardMatchesByPlayer.get(pid)?.size ?? 0);

    return {
      playerId: pid,
      playerName: p?.name ?? "Player",
      playerImageUrl: p?.imageUrl ?? null,
      teamId: tid,
      teamName: teamMeta?.name ?? "Team",
      teamLogoUrl: teamMeta?.logoUrl ?? null,
      goals,
      assists,
      yellowCards,
      redCards,
      matchesPlayed,
    };
  });

  // Spotlight: top scorer, top assist, best team
  const topScorerRow = playerLeaderboardFull
    .slice()
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      return b.matchesPlayed - a.matchesPlayed;
    })[0];

  const topAssistRow = playerLeaderboardFull
    .slice()
    .sort((a, b) => {
      if (b.assists !== a.assists) return b.assists - a.assists;
      return b.matchesPlayed - a.matchesPlayed;
    })[0];

  const bestTeamRow = teamLeaderboard[0];

  const spotlight: TournamentStatsSpotlight = {
    topScorer:
      topScorerRow && topScorerRow.goals > 0
        ? {
            playerId: topScorerRow.playerId,
            playerName: topScorerRow.playerName,
            teamName: topScorerRow.teamName,
            goals: topScorerRow.goals,
          }
        : null,
    topAssist:
      topAssistRow && topAssistRow.assists > 0
        ? {
            playerId: topAssistRow.playerId,
            playerName: topAssistRow.playerName,
            teamName: topAssistRow.teamName,
            assists: topAssistRow.assists,
          }
        : null,
    bestTeam: bestTeamRow
      ? {
          teamId: bestTeamRow.teamId,
          teamName: bestTeamRow.teamName,
          points: bestTeamRow.points,
        }
      : null,
  };

  // Sort player leaderboard per tab and slice for the page.
  const playerLeaderboard = playerLeaderboardFull
    .slice()
    .sort((a, b) => {
      if (input.tab === "top-scorers") {
        if (b.goals !== a.goals) return b.goals - a.goals;
        return b.matchesPlayed - a.matchesPlayed;
      }
      if (input.tab === "assists") {
        if (b.assists !== a.assists) return b.assists - a.assists;
        return b.matchesPlayed - a.matchesPlayed;
      }
      if (input.tab === "cards") {
        if (b.yellowCards !== a.yellowCards) return b.yellowCards - a.yellowCards;
        if (b.redCards !== a.redCards) return b.redCards - a.redCards;
        return b.matchesPlayed - a.matchesPlayed;
      }
      // clean-sheets uses teamLeaderboard
      return b.goals - a.goals;
    })
    .slice(0, limit);

  return {
    tournament,
    phaseOptions: [{ key: "all", label: "All phases" }, ...phaseOptions],
    groupOptions: [{ key: "overall", label: "Overall" }, ...groupOptions],
    summary: {
      totalMatches,
      playedMatches,
      totalGoals,
      totalPlayers,
    },
    spotlight,
    playerLeaderboard,
    teamLeaderboard: teamLeaderboard.slice(0, limit),
    activeTab: input.tab,
  };
}

