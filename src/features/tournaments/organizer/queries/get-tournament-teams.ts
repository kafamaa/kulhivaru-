import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface TournamentTeamEntry {
  id: string;
  teamId: string;
  teamName: string;
  teamSlug: string;
  teamLogoUrl: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface TournamentTeamsData {
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  entries: TournamentTeamEntry[];
}

export async function getTournamentTeams(
  tournamentId: string
): Promise<TournamentTeamsData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: tournament, error: tError } = await supabase
    .from("tournaments")
    .select("id, name, slug")
    .eq("id", tournamentId)
    .single();

  if (tError || !tournament) return null;

  const { data: entries, error: eError } = await supabase
    .from("team_entries")
    .select("id, team_id, status, created_at")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });

  if (eError) return { tournamentId, tournamentName: tournament.name, tournamentSlug: tournament.slug, entries: [] };

  const teamIds = [...new Set((entries ?? []).map((e: { team_id: string }) => e.team_id))];
  if (teamIds.length === 0) {
    return {
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      tournamentSlug: tournament.slug,
      entries: [],
    };
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, slug, logo_url")
    .in("id", teamIds);

  const teamMap = (teams ?? []).reduce(
    (acc: Record<string, { name: string; slug: string; logo_url: string | null }>, t: Record<string, unknown>) => {
      acc[t.id as string] = {
        name: t.name as string,
        slug: t.slug as string,
        logo_url: (t.logo_url as string) ?? null,
      };
      return acc;
    },
    {}
  );

  const list: TournamentTeamEntry[] = (entries ?? []).map((e: Record<string, unknown>) => {
    const team = teamMap[e.team_id as string];
    return {
      id: e.id as string,
      teamId: e.team_id as string,
      teamName: team?.name ?? "Unknown",
      teamSlug: team?.slug ?? "",
      teamLogoUrl: team?.logo_url ?? null,
      status: e.status as TournamentTeamEntry["status"],
      createdAt: e.created_at as string,
    };
  });

  return {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    tournamentSlug: tournament.slug,
    entries: list,
  };
}
