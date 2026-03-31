import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface PublicPlayerTournamentContext {
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  tournamentSport: string;
  tournamentStatus: string;
  tournamentStartDate: string | null;
  tournamentLocation: string | null;

  entryStatus: "pending" | "approved" | "rejected";
  categoryDivision: string;

  standingsRank: number | null;
  standingsPoints: number | null;
  standingsPlayed: number | null;
}

export interface PublicPlayerTeamContext {
  teamId: string;
  teamName: string;
  teamSlug: string;
  teamLogoUrl: string | null;
}

export interface PublicPlayerProfile {
  playerId: string;
  playerName: string;
  playerAvatarUrl: string | null;
  position: string | null;
  preferredPosition: string | null;
  nickname: string | null;
  dob: string | null;
  jerseyNumber: string | null;
  statusBadge: "active" | "suspended" | "unavailable";

  team: PublicPlayerTeamContext | null;
  tournaments: PublicPlayerTournamentContext[];

  primaryTournamentId: string | null;
}

export async function getPublicPlayerProfile(
  playerId: string
): Promise<PublicPlayerProfile | null> {
  const supabase = await createSupabaseServerClient();

  const { data: player, error } = await supabase
    .from("players")
    .select("id, name, image_url, position, nickname, dob, id_number, team_id")
    .eq("id", playerId)
    .single();

  if (error || !player) return null;

  const teamId = (player.team_id as string | null) ?? null;

  const { data: team } = teamId
    ? await supabase
        .from("teams")
        .select("id, name, slug, logo_url")
        .eq("id", teamId)
        .single()
    : { data: null };

  const teamCtx: PublicPlayerTeamContext | null = team
    ? {
        teamId: String(team.id),
        teamName: String(team.name),
        teamSlug: String(team.slug),
        teamLogoUrl: (team.logo_url as string | null) ?? null,
      }
    : null;

  const { data: entries } = teamId
    ? await supabase
        .from("team_entries")
        .select("tournament_id,status")
        .eq("team_id", teamId)
    : { data: [] as any[] };

  const tournamentIds = Array.from(
    new Set((entries ?? []).map((e: any) => String(e.tournament_id)))
  );

  if (tournamentIds.length === 0) {
    return {
      playerId: String(player.id),
      playerName: String(player.name),
      playerAvatarUrl: (player.image_url as string | null) ?? null,
      position: (player.position as string | null) ?? null,
      preferredPosition: (player.position as string | null) ?? null,
      nickname: (player.nickname as string | null) ?? null,
      dob: (player.dob as string | null) ?? null,
      jerseyNumber: (player.id_number as string | null) ?? null,
      statusBadge: "active",
      team: teamCtx,
      tournaments: [],
      primaryTournamentId: null,
    };
  }

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select(
      "id,name,slug,sport,status,start_date,location,organization_id,organizations(name)"
    )
    .in("id", tournamentIds);

  const { data: standingsRows } = await supabase
    .from("standings_cache")
    .select("tournament_id,rank,points,played")
    .eq("team_id", teamId)
    .in("tournament_id", tournamentIds);

  const standingsByTournament = new Map<string, any>();
  for (const r of standingsRows ?? []) {
    standingsByTournament.set(String(r.tournament_id), r);
  }

  const entriesList = (entries ?? []) as any[];
  const tournamentsById = new Map<string, any>(
    (tournaments ?? []).map((t: any) => [String(t.id), t])
  );

  const tournamentContext: PublicPlayerTournamentContext[] = entriesList
    .map((e: any) => {
      const tid = String(e.tournament_id);
      const t = tournamentsById.get(tid);
      if (!t) return null;

      const standings = standingsByTournament.get(tid);

      return {
        tournamentId: tid,
        tournamentName: String(t.name),
        tournamentSlug: String(t.slug),
        tournamentSport: String(t.sport),
        tournamentStatus: String(t.status),
        tournamentStartDate: (t.start_date as string | null) ?? null,
        tournamentLocation: (t.location as string | null) ?? null,
        entryStatus: e.status as PublicPlayerTournamentContext["entryStatus"],
        categoryDivision: "Division TBD",
        standingsRank: standings ? Number(standings.rank ?? null) : null,
        standingsPoints: standings
          ? Number(standings.points ?? null)
          : null,
        standingsPlayed: standings ? Number(standings.played ?? null) : null,
      };
    })
    .filter(Boolean) as PublicPlayerTournamentContext[];

  const primaryTournament =
    tournamentContext.find((t) => t.entryStatus === "approved") ??
    tournamentContext[0] ??
    null;

  return {
    playerId: String(player.id),
    playerName: String(player.name),
    playerAvatarUrl: (player.image_url as string | null) ?? null,
    position: (player.position as string | null) ?? null,
    preferredPosition: (player.position as string | null) ?? null,
    nickname: (player.nickname as string | null) ?? null,
    dob: (player.dob as string | null) ?? null,
    jerseyNumber: (player.id_number as string | null) ?? null,
    statusBadge: "active",
    team: teamCtx,
    tournaments: tournamentContext,
    primaryTournamentId: primaryTournament ? primaryTournament.tournamentId : null,
  };
}

