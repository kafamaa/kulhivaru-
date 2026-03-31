import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { PublicMatchPreview } from "../types";

// Reads a small strip of live/upcoming matches for the homepage.
// Assumes a RLS-safe view `public_matches_preview`.
export async function listLiveMatchesPreview(): Promise<PublicMatchPreview[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("public_matches_preview")
    .select(
      `
      id,
      tournament_name,
      tournament_slug,
      home_team_name,
      away_team_name,
      status_label,
      score
    `
    )
    .order("priority", { ascending: true })
    .limit(10);

  if (error || !data) {
    return [];
  }

  const baseRows = data.map((row: any) => ({
    id: row.id,
    tournamentName: row.tournament_name,
    tournamentSlug: row.tournament_slug,
    homeTeam: row.home_team_name,
    awayTeam: row.away_team_name,
    homeTeamLogoUrl: null as string | null,
    awayTeamLogoUrl: null as string | null,
    statusLabel: row.status_label,
    score: row.score,
  }));

  const teamNames = Array.from(
    new Set(
      baseRows
        .flatMap((r) => [r.homeTeam, r.awayTeam])
        .map((n) => String(n ?? "").trim())
        .filter((n) => n && n.toLowerCase() !== "tbd")
    )
  );

  if (teamNames.length === 0) return baseRows;

  const { data: teamRows } = await supabase
    .from("teams")
    .select("name,logo_url")
    .in("name", teamNames);

  const logoByTeamName = new Map<string, string | null>();
  for (const t of (teamRows ?? []) as Array<{ name: string; logo_url: string | null }>) {
    logoByTeamName.set(String(t.name), t.logo_url ?? null);
  }

  return baseRows.map((row) => ({
    ...row,
    homeTeamLogoUrl: logoByTeamName.get(row.homeTeam) ?? null,
    awayTeamLogoUrl: logoByTeamName.get(row.awayTeam) ?? null,
  }));
}

