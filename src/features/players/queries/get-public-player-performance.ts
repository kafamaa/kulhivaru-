import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface PublicPlayerPerformance {
  appearances: number;
  matchesPlayed: number;

  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;

  minutesInvolved: number;
}

export async function getPublicPlayerPerformance(input: {
  playerId: string;
}): Promise<PublicPlayerPerformance> {
  const supabase = await createSupabaseServerClient();

  const { data: events } = await supabase
    .from("match_events")
    .select("event_type, minute, match_id")
    .eq("player_id", input.playerId);

  if (!events || events.length === 0) {
    return {
      appearances: 0,
      matchesPlayed: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      minutesInvolved: 0,
    };
  }

  const distinctMatches = new Set<string>();

  let goals = 0;
  let assists = 0;
  let yellowCards = 0;
  let redCards = 0;
  let minutesInvolved = 0;

  for (const e of events as any[]) {
    const matchId = e.match_id ? String(e.match_id) : null;
    if (matchId) distinctMatches.add(matchId);

    const type = String(e.event_type ?? "");
    if (type === "goal") goals += 1;
    if (type === "assist") assists += 1;
    if (type === "yellow_card") yellowCards += 1;
    if (type === "red_card") redCards += 1;

    if (e.minute != null) {
      minutesInvolved += Number(e.minute) ?? 0;
    }
  }

  return {
    appearances: distinctMatches.size,
    matchesPlayed: distinctMatches.size,
    goals,
    assists,
    yellowCards,
    redCards,
    minutesInvolved,
  };
}

