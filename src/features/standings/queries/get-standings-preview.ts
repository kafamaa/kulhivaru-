import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface StandingsRowPreview {
  rank: number;
  teamName: string;
  teamId: string;
  points: number;
  played: number;
  logoUrl?: string | null;
}

export async function getStandingsPreview(
  limit = 5
): Promise<StandingsRowPreview[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("public_standings_preview")
    .select("rank, team_name, team_id, points, played")
    .limit(limit);

  if (error || !data) {
    return [];
  }

  const rows = data.map((row: Record<string, unknown>) => ({
    rank: Number(row.rank) ?? 0,
    teamName: row.team_name as string,
    teamId: row.team_id as string,
    points: Number(row.points) ?? 0,
    played: Number(row.played) ?? 0,
  }));

  const teamIds = rows.map((r) => r.teamId).filter(Boolean);
  if (teamIds.length === 0) return rows;

  const { data: teamRows } = await supabase
    .from("teams")
    .select("id,logo_url")
    .in("id", teamIds);

  const logoByTeamId = new Map<string, string | null>();
  for (const t of (teamRows ?? []) as Array<{ id: string; logo_url: string | null }>) {
    logoByTeamId.set(String(t.id), t.logo_url ?? null);
  }

  return rows.map((row) => ({
    ...row,
    logoUrl: logoByTeamId.get(row.teamId) ?? null,
  }));
}
