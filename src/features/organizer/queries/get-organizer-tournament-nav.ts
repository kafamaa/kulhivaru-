import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface OrganizerTournamentNav {
  tournamentId: string;
  name: string;
  slug: string;
}

export async function getOrganizerTournamentNavById(
  tournamentId: string
): Promise<OrganizerTournamentNav | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, name, slug")
    .eq("id", tournamentId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    tournamentId: String(data.id),
    name: String(data.name ?? "Tournament"),
    slug: String(data.slug ?? ""),
  };
}

/** Resolve tournament for a match (sidebar + breadcrumbs on match control). */
export async function getOrganizerTournamentNavForMatch(
  matchId: string
): Promise<OrganizerTournamentNav | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("matches")
    .select("tournament_id, tournaments(id, name, slug)")
    .eq("id", matchId)
    .maybeSingle();

  if (error || !data) return null;
  const t = data.tournaments as { id?: string; name?: string; slug?: string } | null;
  if (!t?.id) return null;
  return {
    tournamentId: String(t.id),
    name: String(t.name ?? "Tournament"),
    slug: String(t.slug ?? ""),
  };
}
