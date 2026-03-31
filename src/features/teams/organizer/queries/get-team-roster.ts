import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface TeamRosterPlayer {
  id: string;
  name: string;
  position: string | null;
  imageUrl: string | null;
  nickname: string | null;
  dob: string | null;
  idNumber: string | null;
}

export interface TeamRosterData {
  teamId: string;
  teamName: string;
  teamSlug: string;
  logoUrl: string | null;
  players: TeamRosterPlayer[];
}

export async function getTeamRoster(teamId: string): Promise<TeamRosterData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, slug, logo_url")
    .eq("id", teamId)
    .single();

  if (teamError || !team) return null;

  const { data: players } = await supabase
    .from("players")
    .select("id, name, position, image_url, nickname, dob, id_number")
    .eq("team_id", teamId)
    .order("name");

  return {
    teamId: team.id as string,
    teamName: team.name as string,
    teamSlug: team.slug as string,
    logoUrl: (team.logo_url as string) ?? null,
    players: (players ?? []).map((p: any) => ({
      id: String(p.id),
      name: String(p.name),
      position: (p.position as string) ?? null,
      imageUrl: (p.image_url as string) ?? null,
      nickname: (p.nickname as string | null) ?? null,
      dob: (p.dob as string | null) ?? null,
      idNumber: (p.id_number as string | null) ?? null,
    })),
  };
}

