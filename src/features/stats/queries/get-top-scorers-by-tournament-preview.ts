import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface TopScorerByTournamentPreview {
  playerId: string;
  playerName: string;
  teamName: string;
  goals: number;
  playerImageUrl?: string | null;
}

export async function getTopScorersByTournamentPreview(
  limit = 5,
  tournamentSlug?: string
): Promise<TopScorerByTournamentPreview[]> {
  const supabase = await createSupabaseServerClient();

  const view =
    tournamentSlug && tournamentSlug !== "all"
      ? "public_top_scorers_by_tournament"
      : "public_top_scorers";

  const select =
    view === "public_top_scorers_by_tournament"
      ? "player_id, player_name, team_name, goals, tournament_slug"
      : "player_id, player_name, team_name, goals";

  const query =
    view === "public_top_scorers_by_tournament" && tournamentSlug
      ? supabase
          .from(view)
          .select(select)
          .eq("tournament_slug", tournamentSlug)
          .limit(limit)
      : supabase.from(view).select(select).limit(limit);

  const { data, error } = await query;
  if (error || !data) return [];

  const base = data.map((row: Record<string, unknown>) => ({
    playerId: row.player_id as string,
    playerName: row.player_name as string,
    teamName: row.team_name as string,
    goals: Number(row.goals) ?? 0,
  }));

  const playerIds = base.map((r) => r.playerId).filter(Boolean);
  if (playerIds.length === 0) return base;

  const { data: players } = await supabase
    .from("players")
    .select("id, image_url")
    .in("id", playerIds);

  const imageByPlayerId = new Map<string, string | null>(
    (players ?? []).map((p: Record<string, unknown>) => [
      String(p.id),
      (p.image_url as string | null) ?? null,
    ])
  );

  return base.map((r) => ({
    ...r,
    playerImageUrl: imageByPlayerId.get(r.playerId) ?? null,
  }));
}

