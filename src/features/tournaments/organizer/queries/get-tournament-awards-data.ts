import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface TournamentAwardsData {
  tournamentId: string;
  tournamentName: string;
  teams: Array<{
    teamId: string;
    teamName: string;
  }>;
  players: Array<{
    playerId: string;
    playerName: string;
    teamName: string;
  }>;
  awards: Record<
    string,
    {
      playerId: string | null;
      teamId: string | null;
      trophyTitle: string;
      trophyImageUrl: string;
    }
  >;
}

export async function getTournamentAwardsData(
  tournamentId: string,
): Promise<TournamentAwardsData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: tournament, error: tErr } = await supabase
    .from("tournaments")
    .select("id,name")
    .eq("id", tournamentId)
    .single();
  if (tErr || !tournament) return null;

  const { data: entries } = await supabase
    .from("team_entries")
    .select("team_id,teams(id,name)")
    .eq("tournament_id", tournamentId)
    .in("status", ["approved", "pending"]);

  const teams = (entries ?? [])
    .map((r: any) => r.teams)
    .filter(Boolean)
    .map((t: any) => ({ teamId: String(t.id), teamName: String(t.name) }));
  const teamById = new Map(teams.map((t) => [t.teamId, t.teamName]));
  const teamIds = teams.map((t) => t.teamId);

  const { data: playerRows } = teamIds.length
    ? await supabase.from("players").select("id,name,team_id").in("team_id", teamIds).order("name")
    : { data: [] as any[] };

  const players = (playerRows ?? []).map((p: any) => ({
    playerId: String(p.id),
    playerName: String(p.name),
    teamName: teamById.get(String(p.team_id)) ?? "Team",
  }));

  const awardKeys = [
    "mvp",
    "best_goalkeeper",
    "best_defender",
    "young_player",
    "top_scorer",
    "best_assist_provider",
    "champion_trophy",
    "runner_up_trophy",
  ] as const;

  const awards: Record<
    string,
    { playerId: string | null; teamId: string | null; trophyTitle: string; trophyImageUrl: string }
  > = Object.fromEntries(
    awardKeys.map((k) => [
      k,
      {
        playerId: null,
        teamId: null,
        trophyTitle: "",
        trophyImageUrl: "",
      },
    ]),
  );

  let awardRows: any[] = [];
  let aErr: any = null;

  const withTrophy = await supabase
    .from("tournament_awards")
    .select("award_key,player_id,team_id,trophy_title,trophy_image_url")
    .eq("tournament_id", tournamentId);
  awardRows = withTrophy.data ?? [];
  aErr = withTrophy.error;

  if (
    aErr &&
    (String(aErr.message ?? "").toLowerCase().includes("trophy_title") ||
      String(aErr.message ?? "").toLowerCase().includes("trophy_image_url") ||
      String(aErr.message ?? "").toLowerCase().includes("team_id"))
  ) {
    const fallback = await supabase
      .from("tournament_awards")
      .select("award_key,player_id,team_id")
      .eq("tournament_id", tournamentId);
    awardRows = fallback.data ?? [];
    aErr = fallback.error;
  }

  if (!aErr) {
    for (const row of awardRows ?? []) {
      const key = String((row as any).award_key);
      const playerId = (row as any).player_id ? String((row as any).player_id) : null;
      const teamId = (row as any).team_id ? String((row as any).team_id) : null;
      const trophyTitle = String((row as any).trophy_title ?? "");
      const trophyImageUrl = String((row as any).trophy_image_url ?? "");
      if (key in awards) {
        awards[key] = {
          playerId,
          teamId,
          trophyTitle,
          trophyImageUrl,
        };
      }
    }
  }

  return {
    tournamentId: String(tournament.id),
    tournamentName: String(tournament.name),
    teams,
    players,
    awards,
  };
}
