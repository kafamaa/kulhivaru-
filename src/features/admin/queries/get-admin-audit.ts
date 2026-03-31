import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export type AdminAuditEventType =
  | "TOURNAMENT_CREATED"
  | "MATCH_CREATED"
  | "MATCH_RESULT_ENTERED"
  | "STANDINGS_CACHE_UPDATED";

export interface AdminAuditEvent {
  id: string;
  at: string;
  type: AdminAuditEventType;
  target: string;
  tournamentId?: string | null;
}

export async function getAdminAuditEvents(limit = 30): Promise<
  { ok: true; rows: AdminAuditEvent[] } | { ok: false; error: string }
> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not set. Admin audit requires the service role key on the server.",
    };
  }

  const [tournaments, matches, standings] = await Promise.all([
    admin
      .from("tournaments")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("matches")
      .select("id, tournament_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("standings_cache")
      .select("tournament_id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(Math.min(limit, 10)),
  ]);

  const firstError = tournaments.error ?? matches.error ?? standings.error;
  if (firstError) return { ok: false, error: firstError.message };

  const rows: AdminAuditEvent[] = [];

  for (const t of tournaments.data ?? []) {
    rows.push({
      id: `tournament:${t.id}`,
      at: String(t.created_at ?? ""),
      type: "TOURNAMENT_CREATED",
      target: String(t.name ?? "Tournament"),
      tournamentId: String(t.id),
    });
  }

  for (const m of matches.data ?? []) {
    const status = String(m.status ?? "");
    rows.push({
      id: `match:${m.id}`,
      at: String(m.created_at ?? ""),
      type: status === "ft" || status === "completed" ? "MATCH_RESULT_ENTERED" : "MATCH_CREATED",
      target: `Match ${String(m.id).slice(0, 8)}…`,
      tournamentId: (m.tournament_id as string | null) ?? null,
    });
  }

  for (const sc of standings.data ?? []) {
    rows.push({
      id: `standings:${String(sc.tournament_id ?? "unknown")}:${String(sc.updated_at ?? "")}`,
      at: String(sc.updated_at ?? ""),
      type: "STANDINGS_CACHE_UPDATED",
      target: `Tournament ${String(sc.tournament_id ?? "").slice(0, 8)}… standings`,
      tournamentId: (sc.tournament_id as string | null) ?? null,
    });
  }

  rows.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  return { ok: true, rows: rows.slice(0, limit) };
}

