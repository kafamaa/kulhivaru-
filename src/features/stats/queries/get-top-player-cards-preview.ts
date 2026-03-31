import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface TopPlayerCardsPreview {
  playerId: string;
  playerName: string;
  teamName: string;
  yellowCards: number;
  redCards: number;
  tournamentName?: string | null;
  tournamentSlug?: string | null;
}

export async function getTopPlayerCardsPreview(
  limit = 10,
  tournamentSlug?: string
): Promise<TopPlayerCardsPreview[]> {
  const supabase = await createSupabaseServerClient();

  const fromView =
    tournamentSlug && tournamentSlug !== "all"
      ? "public_top_cards_by_tournament"
      : "public_top_cards_overall";

  const select =
    fromView === "public_top_cards_by_tournament"
      ? "player_id, player_name, team_name, tournament_slug, tournament_name, yellow_cards, red_cards"
      : "player_id, player_name, team_name, yellow_cards, red_cards";

  const query =
    tournamentSlug && tournamentSlug !== "all"
      ? supabase
          .from(fromView)
          .select(select)
          .eq("tournament_slug", tournamentSlug)
          .limit(limit)
      : supabase.from(fromView).select(select).limit(limit);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => ({
    playerId: row.player_id as string,
    playerName: row.player_name as string,
    teamName: row.team_name as string,
    yellowCards: Number(row.yellow_cards) ?? 0,
    redCards: Number(row.red_cards) ?? 0,
    tournamentSlug:
      fromView === "public_top_cards_by_tournament"
        ? (row.tournament_slug as string | null)
        : null,
    tournamentName:
      fromView === "public_top_cards_by_tournament"
        ? (row.tournament_name as string | null)
        : null,
  }));
}

