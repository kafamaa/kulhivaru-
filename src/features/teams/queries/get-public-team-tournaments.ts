import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface PublicTeamTournamentParticipation {
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  tournamentSport: string;
  tournamentStatus: string;
  tournamentStartDate: string | null;
  tournamentCoverImageUrl: string | null;
  tournamentLogoUrl: string | null;
  organizerName: string | null;

  entryStatus: "pending" | "approved" | "rejected";
  categoryDivision: string;

  standingsRank: number | null;
  standingsPoints: number | null;
  standingsPlayed: number | null;
}

export async function getPublicTeamTournaments(input: {
  teamId: string;
}): Promise<PublicTeamTournamentParticipation[]> {
  const supabase = await createSupabaseServerClient();

  const { data: entries, error: entryError } = await supabase
    .from("team_entries")
    .select("tournament_id,status")
    .eq("team_id", input.teamId);

  if (entryError || !entries) return [];

  const tournamentIds = Array.from(
    new Set((entries ?? []).map((e: any) => String(e.tournament_id)))
  );
  if (tournamentIds.length === 0) return [];

  const { data: tournaments, error: tError } = await supabase
    .from("tournaments")
    .select(
      "id,name,slug,sport,status,start_date,cover_image_url,logo_url,organization_id,organizations(name)"
    )
    .in("id", tournamentIds);

  if (tError || !tournaments) return [];

  // Standings rows (MVP: group_id is typically NULL)
  const { data: standingsRows } = await supabase
    .from("standings_cache")
    .select("tournament_id,rank,points,played,group_id")
    .eq("team_id", input.teamId)
    .in("tournament_id", tournamentIds);

  const standingsByTournament = new Map<string, any>();
  for (const r of standingsRows ?? []) {
    standingsByTournament.set(String(r.tournament_id), r);
  }

  const byTournamentId = new Map<string, any>();
  for (const t of tournaments ?? []) {
    byTournamentId.set(String(t.id), t);
  }

  return (entries ?? [])
    .map((e: any) => {
      const tournament = byTournamentId.get(String(e.tournament_id));
      if (!tournament) return null;
      const standings = standingsByTournament.get(String(e.tournament_id));

      const entryStatus = e.status as
        | "pending"
        | "approved"
        | "rejected";

      const categoryDivision = "Division TBD";

      return {
        tournamentId: String(tournament.id),
        tournamentName: String(tournament.name),
        tournamentSlug: String(tournament.slug),
        tournamentSport: String(tournament.sport),
        tournamentStatus: String(tournament.status),
        tournamentStartDate: (tournament.start_date as string | null) ?? null,
        tournamentCoverImageUrl:
          (tournament.cover_image_url as string | null) ?? null,
        tournamentLogoUrl: (tournament.logo_url as string | null) ?? null,
        organizerName: (tournament.organizations?.name as string | null) ?? null,
        entryStatus,
        categoryDivision,
        standingsRank: standings ? Number(standings.rank) : null,
        standingsPoints: standings ? Number(standings.points) : null,
        standingsPlayed: standings ? Number(standings.played) : null,
      };
    })
    .filter(Boolean) as PublicTeamTournamentParticipation[];
}

