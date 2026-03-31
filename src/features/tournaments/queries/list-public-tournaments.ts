import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { PublicTournamentCardData } from "../types";

type StatusFilter = "ongoing" | "upcoming" | "completed" | "all";

interface ListPublicTournamentsOptions {
  status?: StatusFilter;
  limit?: number;
}

// Reads public tournaments (RLS-safe). Use for ongoing/upcoming sections.
export async function listPublicTournaments(
  options: ListPublicTournamentsOptions = {}
): Promise<PublicTournamentCardData[]> {
  const { status = "all", limit = 12 } = options;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("public_tournaments")
    .select(
      "id, slug, name, sport, location, status, cover_image_url, logo_url, organizer_name, team_count, start_date, is_registration_open"
    )
    .order("status", { ascending: true });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query.limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    sport: row.sport as string,
    location: (row.location as string) ?? null,
    status: row.status as PublicTournamentCardData["status"],
    coverImageUrl: (row.cover_image_url as string) ?? null,
    logoUrl: (row.logo_url as string) ?? null,
    organizerName: (row.organizer_name as string) ?? null,
    teamCount: (row.team_count as number) ?? null,
    startDate: (row.start_date as string) ?? null,
    isRegistrationOpen: Boolean(row.is_registration_open),
  }));
}
