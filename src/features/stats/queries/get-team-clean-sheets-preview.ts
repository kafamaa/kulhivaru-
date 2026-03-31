import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface TeamCleanSheetsPreview {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
  cleanSheets: number;
  tournamentName?: string | null;
  tournamentSlug?: string | null;
}

export async function getTeamCleanSheetsPreview(
  limit = 10,
  tournamentSlug?: string
): Promise<TeamCleanSheetsPreview[]> {
  const supabase = await createSupabaseServerClient();

  const fromView =
    tournamentSlug && tournamentSlug !== "all"
      ? "public_team_clean_sheets_by_tournament"
      : "public_team_clean_sheets_overall";

  const select =
    fromView === "public_team_clean_sheets_by_tournament"
      ? "team_id, team_name, logo_url, tournament_slug, tournament_name, clean_sheets"
      : "team_id, team_name, logo_url, clean_sheets";

  const query =
    tournamentSlug && tournamentSlug !== "all"
      ? supabase
          .from(fromView)
          .select(select)
          .eq("tournament_slug", tournamentSlug)
          .limit(limit)
      : supabase.from(fromView).select(select).limit(limit);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => ({
    teamId: row.team_id as string,
    teamName: row.team_name as string,
    logoUrl: (row.logo_url as string | null) ?? null,
    cleanSheets: Number(row.clean_sheets) ?? 0,
    tournamentSlug:
      fromView === "public_team_clean_sheets_by_tournament"
        ? (row.tournament_slug as string | null)
        : null,
    tournamentName:
      fromView === "public_team_clean_sheets_by_tournament"
        ? (row.tournament_name as string | null)
        : null,
  }));
}

