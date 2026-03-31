import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface FeaturedPlayerRow {
  id: string;
  name: string;
  teamName: string | null;
  teamId: string | null;
  imageUrl: string | null;
  position: string | null;
  goals: number;
  assists: number;
}

export async function getFeaturedPlayer(): Promise<FeaturedPlayerRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("public_featured_player")
    .select("id, name, image_url, position, team_name, team_id, goals, assists")
    .order("goals", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    teamName: data.team_name ?? null,
    teamId: data.team_id ?? null,
    imageUrl: data.image_url ?? null,
    position: data.position ?? null,
    goals: Number(data.goals) ?? 0,
    assists: Number(data.assists) ?? 0,
  };
}
