import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface FeaturedTeamRow {
  id: string;
  name: string;
  logoUrl: string | null;
  points: number;
  tournamentName: string | null;
}

export async function getFeaturedTeam(): Promise<FeaturedTeamRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("public_featured_team")
    .select("id, name, logo_url, points, tournament_name")
    .order("points", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    logoUrl: data.logo_url ?? null,
    points: Number(data.points) ?? 0,
    tournamentName: data.tournament_name ?? null,
  };
}
