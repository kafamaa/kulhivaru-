import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface TopAssistPreview {
  playerId: string;
  playerName: string;
  teamName: string;
  assists: number;
  tournamentName?: string | null;
  tournamentSlug?: string | null;
  playerImageUrl?: string | null;
}

export async function getTopAssistsPreview(
  limit = 10,
  tournamentSlug?: string
): Promise<TopAssistPreview[]> {
  const supabase = await createSupabaseServerClient();

  const fromView =
    tournamentSlug && tournamentSlug !== "all"
      ? "public_top_assists_by_tournament"
      : "public_top_assists_overall";

  const select =
    fromView === "public_top_assists_by_tournament"
      ? "player_id, player_name, team_name, tournament_slug, tournament_name, assists"
      : "player_id, player_name, team_name, assists";

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

  const base = data.map((row: Record<string, unknown>) => ({
    playerId: row.player_id as string,
    playerName: row.player_name as string,
    teamName: row.team_name as string,
    assists: Number(row.assists) ?? 0,
    tournamentSlug:
      fromView === "public_top_assists_by_tournament"
        ? (row.tournament_slug as string | null)
        : null,
    tournamentName:
      fromView === "public_top_assists_by_tournament"
        ? (row.tournament_name as string | null)
        : null,
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

