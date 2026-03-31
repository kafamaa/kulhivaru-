import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export interface AdminTournamentRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  sport: string;
  startDate: string | null;
  organizationId: string | null;
  organizationName: string | null;
  createdAt: string | null;
}

export async function getAdminTournaments(limit = 50): Promise<
  { ok: true; rows: AdminTournamentRow[] } | { ok: false; error: string }
> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not set. Admin lists require the service role key on the server.",
    };
  }

  const { data, error } = await admin
    .from("tournaments")
    .select(
      "id, name, slug, status, sport, start_date, organization_id, created_at, organizations(name)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to load tournaments" };

  return {
    ok: true,
    rows: data.map((r: any) => ({
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      status: String(r.status),
      sport: String(r.sport),
      startDate: (r.start_date as string | null) ?? null,
      organizationId: (r.organization_id as string | null) ?? null,
      organizationName: (r.organizations?.name as string | null) ?? null,
      createdAt: (r.created_at as string | null) ?? null,
    })),
  };
}

