import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface PublicPlayerRankings {
  topScorersRank: number | null;
  topScorersRankLabel: string | null;
  topScorersGoals: number;
}

export async function getPublicPlayerRankings(input: {
  playerId: string;
}): Promise<PublicPlayerRankings> {
  const supabase = await createSupabaseServerClient();

  // We rely on the existing public_top_scorers view for "rank".
  const { data, error } = await supabase
    .from("public_top_scorers")
    .select("player_id, player_name, goals")
    .order("goals", { ascending: false })
    .limit(100);

  if (error || !data) {
    return {
      topScorersRank: null,
      topScorersRankLabel: null,
      topScorersGoals: 0,
    };
  }

  const rows = data as any[];

  const idx = rows.findIndex((r) => String(r.player_id) === input.playerId);
  const rank = idx >= 0 ? idx + 1 : null;

  const playerGoals = idx >= 0 ? Number(rows[idx]?.goals ?? 0) : 0;

  // Assists rank isn’t available as a view yet (MVP).
  return {
    topScorersRank: rank,
    topScorersRankLabel:
      rank != null ? `#${rank} in goals` : null,
    topScorersGoals: playerGoals,
  };
}

