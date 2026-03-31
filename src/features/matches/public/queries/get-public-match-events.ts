import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type PublicMatchEventType =
  | "goal"
  | "own_goal"
  | "assist"
  | "yellow_card"
  | "red_card"
  | "sub_in"
  | "sub_out"
  | "team_foul"
  | "penalty_free_kick";

export interface PublicMatchEventPlayer {
  playerId: string;
  playerName: string;
  teamId: string | null;
  teamName: string | null;
  teamLogoUrl: string | null;
}

export interface PublicMatchEvent {
  id: string;
  matchId: string;
  eventType: PublicMatchEventType;
  minute: number | null;
  periodIndex: number | null;
  teamId: string | null;
  eventMeta: Record<string, unknown>;
  createdAt: string;
  player: PublicMatchEventPlayer | null;
}

export async function getPublicMatchEvents(input: {
  matchId: string;
}): Promise<PublicMatchEvent[]> {
  const supabase = await createSupabaseServerClient();

  const { data: eventsRows, error } = await supabase
    .from("match_events")
    .select("id,event_type,minute,period_index,team_id,event_meta,player_id,created_at,match_id")
    .eq("match_id", input.matchId)
    .order("minute", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !eventsRows) return [];

  const events = (eventsRows ?? []) as Array<{
    id: string;
    event_type: string;
    minute: number | null;
    period_index: number | null;
    team_id: string | null;
    event_meta: Record<string, unknown> | null;
    player_id: string | null;
    created_at: string;
    match_id: string;
  }>;

  const playerIds = Array.from(
    new Set(events.map((e) => (e.player_id ? String(e.player_id) : null)).filter(Boolean))
  ) as string[];

  const { data: playersRows, error: playersErr } = playerIds.length
    ? await supabase
        .from("players")
        .select("id,name,team_id")
        .in("id", playerIds)
    : { data: [] as any[] };

  if (playersErr) throw new Error(playersErr.message);

  const players = (playersRows ?? []) as Array<{
    id: string;
    name: string;
    team_id: string | null;
  }>;

  const teamIds = Array.from(new Set(players.map((p) => (p.team_id ? String(p.team_id) : null)).filter(Boolean))) as string[];
  const { data: teamsRows, error: teamsErr } = teamIds.length
    ? await supabase
        .from("teams")
        .select("id,name,logo_url")
        .in("id", teamIds)
    : { data: [] as any[] };

  if (teamsErr) throw new Error(teamsErr.message);

  const teamById = new Map<string, any>(
    (teamsRows ?? []).map((t: any) => [String(t.id), t])
  );
  const playerById = new Map<string, any>(
    players.map((p) => [String(p.id), p])
  );

  return events.map((e) => {
    const eventType = String(e.event_type) as PublicMatchEventType;
    const pid = e.player_id ? String(e.player_id) : null;
    const p = pid ? playerById.get(pid) : undefined;
    const tid = p?.team_id ? String(p.team_id) : null;
    const t = tid ? teamById.get(tid) : undefined;

    return {
      id: String(e.id),
      matchId: String(e.match_id),
      eventType,
      minute: e.minute != null ? Number(e.minute) : null,
      periodIndex: e.period_index != null ? Number(e.period_index) : null,
      teamId: e.team_id ? String(e.team_id) : null,
      eventMeta: (e.event_meta as Record<string, unknown>) ?? {},
      createdAt: String(e.created_at),
      player: pid && p
        ? {
            playerId: pid,
            playerName: String(p.name),
            teamId: tid,
            teamName: t ? (String(t.name) ?? null) : null,
            teamLogoUrl: t ? ((t.logo_url as string | null) ?? null) : null,
          }
        : null,
    };
  });
}

