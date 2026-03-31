import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export interface AdminAnalyticsSnapshot {
  organizations: number;
  tournaments: number;
  activeTournaments: number;
  matches: number;
  players: number;
  /** Platform profiles (accounts with a row in `profiles`). */
  users: number;
  standingsRows: number;
}

export async function getAdminAnalyticsSnapshot(): Promise<
  { ok: true; data: AdminAnalyticsSnapshot } | { ok: false; error: string }
> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not set. Admin analytics require the service role key on the server.",
    };
  }

  const [
    orgs,
    tournaments,
    activeTournaments,
    matches,
    players,
    profiles,
    standingsRows,
  ] = await Promise.all([
    admin.from("organizations").select("id", { count: "exact", head: true }),
    admin.from("tournaments").select("id", { count: "exact", head: true }),
    admin
      .from("tournaments")
      .select("id", { count: "exact", head: true })
      .in("status", ["upcoming", "ongoing"]),
    admin.from("matches").select("id", { count: "exact", head: true }),
    admin.from("players").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("standings_cache")
      .select("id", { count: "exact", head: true }),
  ]);

  const firstError =
    orgs.error ??
    tournaments.error ??
    activeTournaments.error ??
    matches.error ??
    players.error ??
    profiles.error ??
    standingsRows.error;
  if (firstError) return { ok: false, error: firstError.message };

  const userCount = profiles.count ?? 0;

  return {
    ok: true,
    data: {
      organizations: orgs.count ?? 0,
      tournaments: tournaments.count ?? 0,
      activeTournaments: activeTournaments.count ?? 0,
      matches: matches.count ?? 0,
      players: players.count ?? 0,
      users: userCount,
      standingsRows: standingsRows.count ?? 0,
    },
  };
}

