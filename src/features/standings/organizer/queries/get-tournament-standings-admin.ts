import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface OrganizerStandingsRow {
  teamId: string;
  teamName: string;
  rank: number;
  points: number;
  played: number;
  updatedAt: string | null;
}

export interface OrganizerTournamentStandingsAdminData {
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  status: string;
  rows: OrganizerStandingsRow[];
  lastUpdatedAt: string | null;
}

export async function getTournamentStandingsAdmin(
  tournamentId: string
): Promise<OrganizerTournamentStandingsAdminData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: t, error: tError } = await supabase
    .from("tournaments")
    .select("id, name, slug, status")
    .eq("id", tournamentId)
    .single();

  if (tError || !t) return null;

  const { data, error } = await supabase
    .from("standings_cache")
    .select("team_id, rank, points, played, updated_at, teams(name)")
    .eq("tournament_id", tournamentId)
    .order("rank", { ascending: true });

  if (error || !data) {
    return {
      tournamentId: String(t.id),
      tournamentName: String(t.name),
      tournamentSlug: String(t.slug),
      status: String(t.status),
      rows: [],
      lastUpdatedAt: null,
    };
  }

  const rows: OrganizerStandingsRow[] = data.map((r: any) => ({
    teamId: String(r.team_id),
    teamName: String(r.teams?.name ?? "Team"),
    rank: Number(r.rank) ?? 0,
    points: Number(r.points) ?? 0,
    played: Number(r.played) ?? 0,
    updatedAt: (r.updated_at as string | null) ?? null,
  }));

  const lastUpdatedAt =
    rows
      .map((r) => r.updatedAt)
      .filter((v): v is string => Boolean(v))
      .sort()
      .at(-1) ?? null;

  return {
    tournamentId: String(t.id),
    tournamentName: String(t.name),
    tournamentSlug: String(t.slug),
    status: String(t.status),
    rows,
    lastUpdatedAt,
  };
}

