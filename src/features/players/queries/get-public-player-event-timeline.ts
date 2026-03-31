import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface PublicPlayerEventTimelineItem {
  id: string;
  eventType: string;
  minute: number | null;
  createdAt: string;

  matchId: string;
  tournamentName: string;
  tournamentSlug: string;
  status: string;

  opponentTeamName: string;
  scoreText: string | null;
  venue: string | null;
}

export async function getPublicPlayerEventTimeline(input: {
  playerId: string;
  playerTeamId: string;
}): Promise<PublicPlayerEventTimelineItem[]> {
  const supabase = await createSupabaseServerClient();

  const { data: events } = await supabase
    .from("match_events")
    .select(
      "id,event_type,minute,created_at,match_id"
    )
    .eq("player_id", input.playerId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (!events || events.length === 0) return [];

  const matchIds = Array.from(
    new Set((events as any[]).map((e) => (e.match_id ? String(e.match_id) : null)).filter(Boolean))
  );

  const { data: matches } = matchIds.length
    ? await supabase
        .from("matches")
        .select(
          "id,status,scheduled_at,round_label,home_team_id,away_team_id,home_score,away_score,tournaments(id,name,slug,sport,status,location)"
        )
        .in("id", matchIds)
    : { data: [] as any[] };

  const matchesById = new Map<string, any>(
    (matches ?? []).map((m: any) => [String(m.id), m])
  );

  // Opponent names
  const opponentTeamIds = new Set<string>();
  for (const mid of matchIds) {
    const m = matchesById.get(mid);
    if (!m) continue;
    const homeTeamId = m.home_team_id ? String(m.home_team_id) : null;
    const awayTeamId = m.away_team_id ? String(m.away_team_id) : null;
    if (homeTeamId && homeTeamId !== input.playerTeamId) opponentTeamIds.add(homeTeamId);
    if (awayTeamId && awayTeamId !== input.playerTeamId) opponentTeamIds.add(awayTeamId);
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

  const items: PublicPlayerEventTimelineItem[] = (events as any[]).map((ev) => {
    const matchId = ev.match_id ? String(ev.match_id) : "unknown";
    const match = matchesById.get(matchId);

    const homeTeamId = match?.home_team_id ? String(match.home_team_id) : null;
    const awayTeamId = match?.away_team_id ? String(match.away_team_id) : null;

    const isHome = homeTeamId === input.playerTeamId;
    const opponentTeamId = isHome ? awayTeamId : homeTeamId;

    const opponentTeamName =
      opponentTeamId && teamNameById.has(opponentTeamId)
        ? teamNameById.get(opponentTeamId) ?? "Opponent"
        : "Opponent";

    const homeScore = match?.home_score != null ? Number(match.home_score) : null;
    const awayScore = match?.away_score != null ? Number(match.away_score) : null;
    const scoreText =
      homeScore != null && awayScore != null ? `${homeScore} - ${awayScore}` : null;

    return {
      id: String(ev.id ?? matchId),
      eventType: String(ev.event_type ?? ""),
      minute: ev.minute != null ? Number(ev.minute) : null,
      createdAt: String(ev.created_at ?? ""),
      matchId,
      tournamentName: String(match?.tournaments?.name ?? "Tournament"),
      tournamentSlug: String(match?.tournaments?.slug ?? ""),
      status: String(match?.status ?? "scheduled"),
      opponentTeamName,
      scoreText,
      venue: (match?.tournaments?.location as string | null) ?? null,
    } satisfies PublicPlayerEventTimelineItem;
  });

  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

