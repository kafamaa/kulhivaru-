import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface TeamOption {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

/**
 * Returns teams that are not yet registered in this tournament.
 * Used for "Invite team" / "Add team" dropdown.
 */
export async function getTeamsNotInTournament(
  tournamentId: string,
  limit = 50
): Promise<TeamOption[]> {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("team_entries")
    .select("team_id")
    .eq("tournament_id", tournamentId);
  const existingIds = new Set((existing ?? []).map((r: { team_id: string }) => r.team_id));

  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, name, slug, logo_url")
    .order("name")
    .limit(limit * 2);

  if (error || !teams) return [];

  const filtered = (teams as Record<string, unknown>[])
    .filter((t) => !existingIds.has(t.id as string))
    .slice(0, limit);

  return filtered.map((t) => ({
    id: t.id as string,
    name: t.name as string,
    slug: t.slug as string,
    logoUrl: (t.logo_url as string) ?? null,
  }));
}
