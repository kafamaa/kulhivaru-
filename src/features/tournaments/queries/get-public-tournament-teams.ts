import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface PublicTournamentTeam {
  teamId: string;
  teamName: string;
  teamSlug: string;
  teamLogoUrl: string | null;
  entryStatus: "pending" | "approved" | "rejected";
}

export async function getPublicTournamentTeams(
  tournamentSlug: string
): Promise<PublicTournamentTeam[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("public_tournament_teams")
    .select("team_id, team_name, team_slug, team_logo_url, entry_status")
    .eq("tournament_slug", tournamentSlug)
    .order("team_name", { ascending: true });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((r) => ({
    teamId: r.team_id as string,
    teamName: r.team_name as string,
    teamSlug: r.team_slug as string,
    teamLogoUrl: (r.team_logo_url as string) ?? null,
    entryStatus: r.entry_status as PublicTournamentTeam["entryStatus"],
  }));
}

