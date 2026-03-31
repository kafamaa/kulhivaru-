import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface PublicTeamPlayer {
  id: string;
  name: string;
  nickname: string | null;
  dob: string | null;
  idNumber: string | null;
  position: string | null;
  imageUrl: string | null;
}

export interface PublicTeamProfile {
  teamId: string;
  teamName: string;
  teamSlug: string;
  logoUrl: string | null;
  players: PublicTeamPlayer[];
}

export async function getPublicTeamProfile(
  teamId: string
): Promise<PublicTeamProfile | null> {
  const supabase = await createSupabaseServerClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, slug, logo_url")
    .eq("id", teamId)
    .single();

  if (teamError || !team) return null;

  const { data: players } = await supabase
    .from("players")
    .select("id, name, nickname, dob, id_number, position, image_url")
    .eq("team_id", teamId)
    .order("name");

  return {
    teamId: String(team.id),
    teamName: String(team.name),
    teamSlug: String(team.slug),
    logoUrl: (team.logo_url as string | null) ?? null,
    players: (players ?? []).map((p: any) => ({
      id: String(p.id),
      name: String(p.name),
      nickname: (p.nickname as string | null) ?? null,
      dob: (p.dob as string | null) ?? null,
      idNumber: (p.id_number as string | null) ?? null,
      position: (p.position as string | null) ?? null,
      imageUrl: (p.image_url as string | null) ?? null,
    })),
  };
}

