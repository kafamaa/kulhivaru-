import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface PublicTournamentSearchResult {
  id: string;
  slug: string;
  name: string;
  sport: string;
  location: string | null;
  status: string;
  startDate: string | null;
  organizerName: string | null;
  teamCount: number | null;
}

export async function searchPublicTournaments(input: {
  q: string;
  limit?: number;
}): Promise<PublicTournamentSearchResult[]> {
  const q = input.q.trim();
  if (!q) return [];

  const supabase = await createSupabaseServerClient();
  const like = `%${q}%`;

  const { data, error } = await supabase
    .from("public_tournaments")
    .select("id, slug, name, sport, location, status, start_date, organizer_name, team_count")
    .or(`name.ilike.${like},sport.ilike.${like},location.ilike.${like},organizer_name.ilike.${like}`)
    .order("start_date", { ascending: false })
    .limit(input.limit ?? 30);

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    sport: String(r.sport),
    location: (r.location as string | null) ?? null,
    status: String(r.status),
    startDate: (r.start_date as string | null) ?? null,
    organizerName: (r.organizer_name as string | null) ?? null,
    teamCount: (r.team_count as number | null) ?? null,
  }));
}

