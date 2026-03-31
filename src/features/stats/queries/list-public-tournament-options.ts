import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export interface PublicTournamentOption {
  slug: string;
  name: string;
  sport: string;
  status: string;
}

export async function listPublicTournamentOptionsForStats(
  limit = 50
): Promise<PublicTournamentOption[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("public_tournaments")
    .select("slug, name, sport, status")
    .order("start_date", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as any[]).map((r) => ({
    slug: String(r.slug),
    name: String(r.name),
    sport: String(r.sport ?? ""),
    status: String(r.status ?? ""),
  }));
}

