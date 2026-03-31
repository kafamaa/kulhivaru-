import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Resolve the tournament for a match from the database: join `matches` → `tournaments`
 * and use `tournaments.id` (must exist). Falls back to client only if the join returns nothing.
 */
export async function resolveMatchTournamentId(
  supabase: SupabaseClient,
  matchId: string,
  fallbackTournamentId: string
): Promise<string> {
  const { data } = await supabase
    .from("matches")
    .select("tournament_id, tournaments!inner(id)")
    .eq("id", matchId)
    .maybeSingle();

  const embedded = data?.tournaments;
  const fromTournamentsTable =
    embedded == null
      ? null
      : Array.isArray(embedded)
        ? embedded[0]?.id
        : (embedded as { id?: string }).id;

  if (fromTournamentsTable != null && String(fromTournamentsTable).length > 0) {
    return String(fromTournamentsTable);
  }

  const tid = data?.tournament_id;
  if (tid != null && String(tid).length > 0) {
    return String(tid);
  }

  return fallbackTournamentId;
}
