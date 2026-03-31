import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export interface AdminOrganizationRow {
  id: string;
  name: string;
  slug: string;
  ownerId: string | null;
  createdAt: string | null;
}

export async function getAdminOrganizations(limit = 50): Promise<{
  ok: true;
  rows: AdminOrganizationRow[];
} | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not set. Admin lists require the service role key on the server.",
    };
  }

  const { data, error } = await admin
    .from("organizations")
    .select("id, name, slug, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to load organizations" };

  return {
    ok: true,
    rows: data.map((r: any) => ({
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      ownerId: (r.owner_id as string | null) ?? null,
      createdAt: (r.created_at as string | null) ?? null,
    })),
  };
}

