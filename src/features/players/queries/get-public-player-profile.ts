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
  isChampion: boolean;
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
  achievements: Array<{
    achievementKey: string;
    valueInt: number;
    tournamentId: string;
    tournamentName: string;
    trophyTitle?: string | null;
    trophyImageUrl?: string | null;
  }>;
}

export async function getPublicPlayerProfile(
  playerId: string
): Promise<PublicPlayerProfile | null> {
  const supabase = await createSupabaseServerClient();

  const { data: player, error } = await supabase
    .from("players")
    .select("id, name, image_url, position, nickname, dob, id_number, jersey_number, team_id")
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
      jerseyNumber:
        (player.jersey_number as string | null) ??
        (player.id_number as string | null) ??
        null,
      statusBadge: "active",
      team: teamCtx,
      tournaments: [],
      primaryTournamentId: null,
      achievements: [],
    };
  }

  let tournaments: any[] = [];
  const tournamentsRes = await supabase
    .from("tournaments")
    .select(
      "id,name,slug,sport,status,start_date,location,organization_id,organizations(name),champion_team_id"
    )
    .in("id", tournamentIds);
  if (!tournamentsRes.error) {
    tournaments = tournamentsRes.data ?? [];
  } else {
    const msg = String(tournamentsRes.error.message ?? "").toLowerCase();
    if (msg.includes("champion_team_id")) {
      const fallbackRes = await supabase
        .from("tournaments")
        .select(
          "id,name,slug,sport,status,start_date,location,organization_id,organizations(name)"
        )
        .in("id", tournamentIds);
      if (!fallbackRes.error) {
        tournaments = fallbackRes.data ?? [];
      }
    }
  }

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
        isChampion:
          teamId != null &&
          String((t as any).champion_team_id ?? "") !== "" &&
          String((t as any).champion_team_id) === String(teamId),
      };
    })
    .filter(Boolean) as PublicPlayerTournamentContext[];

  const primaryTournament =
    tournamentContext.find((t) => t.entryStatus === "approved") ??
    tournamentContext[0] ??
    null;

  let achievementRows: Array<{
    achievement_key: string;
    value_int: number;
    tournament_id: string;
  }> = [];
  const achievementsRes = await supabase
    .from("tournament_player_achievements")
    .select("achievement_key,value_int,tournament_id")
    .eq("player_id", playerId);
  if (!achievementsRes.error) {
    achievementRows = (achievementsRes.data ?? []) as Array<{
      achievement_key: string;
      value_int: number;
      tournament_id: string;
    }>;
  }

  const achievementKeysForTrophy = Array.from(
    new Set(achievementRows.map((r) => String(r.achievement_key))),
  );
  const achievementTournamentIdsForTrophy = Array.from(
    new Set(achievementRows.map((r) => String(r.tournament_id))),
  );

  let trophyAwardRows: Array<{
    award_key: string;
    tournament_id: string;
    trophy_title?: string | null;
    trophy_image_url?: string | null;
  }> = [];
  const trophyRes =
    achievementKeysForTrophy.length && achievementTournamentIdsForTrophy.length
      ? await supabase
          .from("tournament_awards")
          .select("award_key,tournament_id,trophy_title,trophy_image_url")
          .in("award_key", achievementKeysForTrophy)
          .in("tournament_id", achievementTournamentIdsForTrophy)
      : { data: [], error: null as any };

  if (!trophyRes.error) {
    trophyAwardRows = (trophyRes.data ?? []) as Array<{
      award_key: string;
      tournament_id: string;
      trophy_title?: string | null;
      trophy_image_url?: string | null;
    }>;
  } else {
    const msg = String(trophyRes.error.message ?? "").toLowerCase();
    const maybeMissingColumns = msg.includes("trophy_title") || msg.includes("trophy_image_url");
    if (maybeMissingColumns) {
      const fallbackRes = await supabase
        .from("tournament_awards")
        .select("award_key,tournament_id")
        .in("award_key", achievementKeysForTrophy)
        .in("tournament_id", achievementTournamentIdsForTrophy);
      if (!fallbackRes.error) {
        trophyAwardRows = (fallbackRes.data ?? []) as Array<{
          award_key: string;
          tournament_id: string;
        }>;
      }
    }
  }

  const trophyByKey = new Map<
    string,
    { trophyTitle: string | null; trophyImageUrl: string | null }
  >();
  for (const row of trophyAwardRows) {
    const k = `${String(row.award_key)}::${String(row.tournament_id)}`;
    trophyByKey.set(k, {
      trophyTitle: row.trophy_title ?? null,
      trophyImageUrl: row.trophy_image_url ?? null,
    });
  }

  const achievements = achievementRows.map((row) => ({
    ...(() => {
      const meta = trophyByKey.get(`${String(row.achievement_key)}::${String(row.tournament_id)}`);
      return {
        trophyTitle: meta?.trophyTitle ?? null,
        trophyImageUrl: meta?.trophyImageUrl ?? null,
      };
    })(),
    achievementKey: String(row.achievement_key),
    valueInt: Number(row.value_int ?? 0),
    tournamentId: String(row.tournament_id),
    tournamentName:
      tournamentContext.find((t) => t.tournamentId === String(row.tournament_id))
        ?.tournamentName ?? "Tournament",
  }));

  return {
    playerId: String(player.id),
    playerName: String(player.name),
    playerAvatarUrl: (player.image_url as string | null) ?? null,
    position: (player.position as string | null) ?? null,
    preferredPosition: (player.position as string | null) ?? null,
    nickname: (player.nickname as string | null) ?? null,
    dob: (player.dob as string | null) ?? null,
    jerseyNumber:
      (player.jersey_number as string | null) ??
      (player.id_number as string | null) ??
      null,
    statusBadge: "active",
    team: teamCtx,
    tournaments: tournamentContext,
    primaryTournamentId: primaryTournament ? primaryTournament.tournamentId : null,
    achievements,
  };
}

