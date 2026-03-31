import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type ResultBadge = "W" | "D" | "L";

export interface PublicPlayerContributionCounts {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export interface PublicPlayerRecentMatch {
  matchId: string;
  tournamentName: string;
  tournamentSlug: string;
  tournamentSport: string;
  tournamentStatus: string;

  scheduledAt: string | null;
  roundLabel: string | null;

  opponentTeamName: string;
  status: string;
  resultBadge: ResultBadge | null;
  scoreText: string | null;
  venue: string | null;

  contributions: PublicPlayerContributionCounts;
}

export async function getPublicPlayerRecentMatches(input: {
  playerId: string;
  playerTeamId: string;
}): Promise<PublicPlayerRecentMatch[]> {
  const supabase = await createSupabaseServerClient();

  // We build recent matches from the player's event history.
  const { data: events } = await supabase
    .from("match_events")
    .select("match_id,event_type,minute,created_at")
    .eq("player_id", input.playerId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!events || events.length === 0) return [];

  // Unique match ids in the order we encounter them
  const matchIdOrder: string[] = [];
  const matchSet = new Set<string>();
  for (const ev of events as any[]) {
    const mid = ev.match_id ? String(ev.match_id) : null;
    if (!mid) continue;
    if (!matchSet.has(mid)) {
      matchSet.add(mid);
      matchIdOrder.push(mid);
    }
    if (matchIdOrder.length >= 10) break;
  }

  const matchIds = matchIdOrder.slice(0, 5);
  if (matchIds.length === 0) return [];

  // Fetch match details for score + opponent names.
  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id,status,scheduled_at,round_label,home_team_id,away_team_id,home_score,away_score,tournaments(id,name,slug,sport,status,location)"
    )
    .in("id", matchIds);

  const matchesById = new Map<string, any>(
    (matches ?? []).map((m: any) => [String(m.id), m])
  );

  // Count contributions by match_id from the event list we already fetched.
  const countsByMatch = new Map<string, PublicPlayerContributionCounts>();
  for (const ev of events as any[]) {
    const mid = ev.match_id ? String(ev.match_id) : null;
    if (!mid) continue;
    if (!matchSet.has(mid)) continue;

    const cur =
      countsByMatch.get(mid) ?? ({
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
      } satisfies PublicPlayerContributionCounts);

    const type = String(ev.event_type ?? "");
    if (type === "goal") cur.goals += 1;
    if (type === "assist") cur.assists += 1;
    if (type === "yellow_card") cur.yellowCards += 1;
    if (type === "red_card") cur.redCards += 1;

    countsByMatch.set(mid, cur);
  }

  // Load team names for opponents
  const opponentTeamIds = new Set<string>();
  for (const mid of matchIds) {
    const m = matchesById.get(mid);
    if (!m) continue;
    if (m.home_team_id && String(m.home_team_id) !== input.playerTeamId) {
      opponentTeamIds.add(String(m.home_team_id));
    }
    if (m.away_team_id && String(m.away_team_id) !== input.playerTeamId) {
      opponentTeamIds.add(String(m.away_team_id));
    }
  }

  const { data: teams } = opponentTeamIds.size
    ? await supabase
        .from("teams")
        .select("id,name")
        .in("id", Array.from(opponentTeamIds))
    : { data: [] as any[] };

  const teamNameById = new Map<string, string>(
    (teams ?? []).map((t: any) => [String(t.id), String(t.name)])
  );

  const result: PublicPlayerRecentMatch[] = [];

  for (const mid of matchIds) {
    const m = matchesById.get(mid);
    if (!m) continue;

    const status = String(m.status ?? "scheduled");
    const isFinished = status === "ft" || status === "completed";
    const homeTeamId = m.home_team_id ? String(m.home_team_id) : null;
    const awayTeamId = m.away_team_id ? String(m.away_team_id) : null;

    const isHome = homeTeamId === input.playerTeamId;
    const opponentTeamId = isHome
      ? (awayTeamId as string | null)
      : (homeTeamId as string | null);

    const opponentTeamName =
      opponentTeamId && teamNameById.has(opponentTeamId)
        ? teamNameById.get(opponentTeamId) ?? "Opponent"
        : "Opponent";

    const homeScore = m.home_score != null ? Number(m.home_score) : null;
    const awayScore = m.away_score != null ? Number(m.away_score) : null;

    let scoreText: string | null = null;
    let resultBadge: ResultBadge | null = null;

    if (isFinished && homeScore != null && awayScore != null) {
      scoreText = `${homeScore} - ${awayScore}`;
      const teamGoals = isHome ? homeScore : awayScore;
      const oppGoals = isHome ? awayScore : homeScore;
      if (teamGoals > oppGoals) resultBadge = "W";
      else if (teamGoals < oppGoals) resultBadge = "L";
      else resultBadge = "D";
    }

    const scheduledAt = m.scheduled_at ? String(m.scheduled_at) : null;
    const roundLabel = m.round_label ? String(m.round_label) : null;
    const venue = (m.tournaments?.location as string | null) ?? null;

    const contributions =
      countsByMatch.get(mid) ?? ({
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
      } satisfies PublicPlayerContributionCounts);

    result.push({
      matchId: mid,
      tournamentName: String(m.tournaments?.name ?? "Tournament"),
      tournamentSlug: String(m.tournaments?.slug ?? ""),
      tournamentSport: String(m.tournaments?.sport ?? ""),
      tournamentStatus: String(m.tournaments?.status ?? ""),
      scheduledAt,
      roundLabel,
      opponentTeamName,
      status,
      resultBadge,
      scoreText,
      venue,
      contributions,
    });
  }

  // Ensure newest first by scheduledAt where possible
  result.sort((a, b) => {
    const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
    const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
    return tb - ta;
  });

  return result;
}

