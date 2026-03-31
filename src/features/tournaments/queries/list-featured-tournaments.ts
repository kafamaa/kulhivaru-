import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { PublicTournamentCardData } from "../types";

// Reads featured tournaments for the public homepage.
// Assumes a RLS-safe view `public_tournaments` with a boolean `is_featured` flag.
export async function listFeaturedTournaments(): Promise<
  PublicTournamentCardData[]
> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("public_tournaments")
    .select(
      "id, slug, name, sport, location, status, cover_image_url, logo_url, organizer_name, team_count, start_date, is_registration_open"
    )
    .eq("is_featured", true)
    .order("status", { ascending: true })
    .limit(6);

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

