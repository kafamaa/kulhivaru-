import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface TeamTopScorer {
  playerId: string;
  playerName: string;
  goals: number;
}

export async function getPublicTeamTopScorer(input: {
  teamId: string;
}): Promise<TeamTopScorer | null> {
  const supabase = await createSupabaseServerClient();

  const { data: players, error: pError } = await supabase
    .from("players")
    .select("id,name")
    .eq("team_id", input.teamId);

  if (pError || !players || players.length === 0) return null;

  const playerIds = (players as any[]).map((p) => p.id as string);

  const { data: goalsEvents, error: eError } = await supabase
    .from("match_events")
    .select("player_id")
    .eq("event_type", "goal")
    .in("player_id", playerIds);

  if (eError || !goalsEvents) return null;

  const goalsByPlayer = new Map<string, number>();
  for (const ev of goalsEvents as any[]) {
    const pid = ev.player_id ? String(ev.player_id) : null;
    if (!pid) continue;
    goalsByPlayer.set(pid, (goalsByPlayer.get(pid) ?? 0) + 1);
  }

  let best: TeamTopScorer | null = null;
  for (const p of players as any[]) {
    const pid = String(p.id);
    const goals = goalsByPlayer.get(pid) ?? 0;
    if (!best || goals > best.goals) {
      best = { playerId: pid, playerName: String(p.name), goals };
    }
  }

  if (!best || best.goals <= 0) return null;
  return best;
}

