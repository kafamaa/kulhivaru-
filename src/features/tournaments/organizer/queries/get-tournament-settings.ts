import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { TournamentSettingsFormValues } from "@/src/features/tournaments/organizer/schemas/tournament-settings-schema";

export interface OrganizerTournamentSettingsData {
  id: string;
  organizationId: string | null;
  name: string;
  slug: string;
  sport: string;
  location: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  isRegistrationOpen: boolean;
  defaults: TournamentSettingsFormValues;
}

export async function getTournamentSettings(
  tournamentId: string
): Promise<OrganizerTournamentSettingsData | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("tournaments")
    .select(
      "id, organization_id, name, slug, sport, location, status, start_date, end_date, cover_image_url, logo_url, is_registration_open"
    )
    .eq("id", tournamentId)
    .single();

  if (error || !data) return null;

  const startDate = (data.start_date as string | null) ?? null;
  const endDate = (data.end_date as string | null) ?? null;

  const defaults: TournamentSettingsFormValues = {
    name: String(data.name),
    sport: String(data.sport),
    location: (data.location as string | null) ?? null,
    startDate,
    endDate,
    coverImageUrl: (data.cover_image_url as string | null) ?? null,
    logoUrl: (data.logo_url as string | null) ?? null,
    status: (data.status as TournamentSettingsFormValues["status"]) ?? "draft",
    isRegistrationOpen: Boolean(data.is_registration_open),
  };

  return {
    id: String(data.id),
    organizationId: (data.organization_id as string | null) ?? null,
    name: String(data.name),
    slug: String(data.slug),
    sport: String(data.sport),
    location: (data.location as string | null) ?? null,
    status: String(data.status),
    startDate,
    endDate,
    coverImageUrl: (data.cover_image_url as string | null) ?? null,
    logoUrl: (data.logo_url as string | null) ?? null,
    isRegistrationOpen: Boolean(data.is_registration_open),
    defaults,
  };
}

