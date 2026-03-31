import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type ResultBadge = "W" | "D" | "L";

export interface PublicPlayerUpcomingMatch {
  matchId: string;
  tournamentName: string;
  tournamentSlug: string;
  tournamentSport: string;
  tournamentStatus: string;

  scheduledAt: string | null;
  roundLabel: string | null;

  opponentTeamName: string;
  status: string;
  venue: string | null;

  contributions: {
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
}

export async function getPublicPlayerUpcomingMatches(input: {
  playerId: string;
  playerTeamId: string;
}): Promise<PublicPlayerUpcomingMatch[]> {
  const supabase = await createSupabaseServerClient();

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id,status,scheduled_at,round_label,home_team_id,away_team_id,home_score,away_score,tournaments(id,name,slug,sport,status,location)"
    )
    .or(`home_team_id.eq.${input.playerTeamId},away_team_id.eq.${input.playerTeamId}`)
    .order("scheduled_at", { ascending: true, nullsFirst: true })
    .limit(20);

  if (!matches || matches.length === 0) return [];

  const finishedStatuses = ["ft", "completed"];
  const upcomingMatches = (matches as any[]).filter((m) => {
    const status = String(m.status ?? "scheduled");
    return !finishedStatuses.includes(status);
  });

  const sliced = upcomingMatches.slice(0, 5);
  if (sliced.length === 0) return [];

  const matchIds = sliced.map((m) => String(m.id));

  // Opponent names
  const opponentTeamIds = new Set<string>();
  for (const m of matches as any[]) {
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

  // Contribution counts in these upcoming matches (if any events exist yet)
  const { data: events } = await supabase
    .from("match_events")
    .select("event_type, match_id")
    .eq("player_id", input.playerId)
    .in("match_id", matchIds);

  const contribByMatch = new Map<string, PublicPlayerUpcomingMatch["contributions"]>();
  for (const ev of events ?? []) {
    const mid = ev.match_id ? String(ev.match_id) : null;
    if (!mid) continue;
    const cur =
      contribByMatch.get(mid) ?? ({
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
      } satisfies PublicPlayerUpcomingMatch["contributions"]);

    const type = String(ev.event_type ?? "");
    if (type === "goal") cur.goals += 1;
    if (type === "assist") cur.assists += 1;
    if (type === "yellow_card") cur.yellowCards += 1;
    if (type === "red_card") cur.redCards += 1;
    contribByMatch.set(mid, cur);
  }

  const result: PublicPlayerUpcomingMatch[] = sliced.map((m) => {
    const homeTeamId = m.home_team_id ? String(m.home_team_id) : null;
    const awayTeamId = m.away_team_id ? String(m.away_team_id) : null;
    const isHome = homeTeamId === input.playerTeamId;
    const opponentTeamId = isHome ? awayTeamId : homeTeamId;

    const opponentTeamName =
      opponentTeamId ? teamNameById.get(opponentTeamId) ?? "Opponent" : "Opponent";

    const scheduledAt = m.scheduled_at ? String(m.scheduled_at) : null;
    const roundLabel = m.round_label ? String(m.round_label) : null;
    const venue = (m.tournaments?.location as string | null) ?? null;

    return {
      matchId: String(m.id),
      tournamentName: String(m.tournaments?.name ?? "Tournament"),
      tournamentSlug: String(m.tournaments?.slug ?? ""),
      tournamentSport: String(m.tournaments?.sport ?? ""),
      tournamentStatus: String(m.tournaments?.status ?? ""),
      scheduledAt,
      roundLabel,
      opponentTeamName,
      status: String(m.status ?? "scheduled"),
      venue,
      contributions:
        contribByMatch.get(String(m.id)) ?? ({
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
        } satisfies PublicPlayerUpcomingMatch["contributions"]),
    };
  });

  result.sort((a, b) => {
    const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
    const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
    return ta - tb;
  });

  return result;
}

