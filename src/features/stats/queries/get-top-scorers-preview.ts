import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface TopScorerPreview {
  id: string;
  name: string;
  teamName: string;
  goals: number;
  imageUrl?: string | null;
}

export async function getTopScorersPreview(
  limit = 5
): Promise<TopScorerPreview[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("public_top_scorers")
    .select("player_id, player_name, team_name, goals")
    .limit(limit);

  if (error || !data) {
    return [];
  }

  const rows = data.map((row: Record<string, unknown>) => ({
    id: row.player_id as string,
    name: row.player_name as string,
    teamName: row.team_name as string,
    goals: Number(row.goals) ?? 0,
  }));

  const playerIds = rows.map((r) => r.id).filter(Boolean);
  if (playerIds.length === 0) return rows;

  const { data: playerRows } = await supabase
    .from("players")
    .select("id,image_url")
    .in("id", playerIds);

  const imageByPlayerId = new Map<string, string | null>();
  for (const p of (playerRows ?? []) as Array<{ id: string; image_url: string | null }>) {
    imageByPlayerId.set(String(p.id), p.image_url ?? null);
  }

  return rows.map((row) => ({
    ...row,
    imageUrl: imageByPlayerId.get(row.id) ?? null,
  }));
}
