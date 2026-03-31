import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export interface SuperAdminUserRow {
  id: string;
  email: string | null;
  role: string;
  displayName: string | null;
  updatedAt: string | null;
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const chunk = await Promise.all(batch.map(fn));
    out.push(...chunk);
  }
  return out;
}

export async function getSuperAdminUsers(max = 120): Promise<
  { ok: true; rows: SuperAdminUserRow[] } | { ok: false; error: string }
> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not set. User directory requires the service role on the server.",
    };
  }

  const { data: profiles, error: pErr } = await admin
    .from("profiles")
    .select("id, role, display_name, updated_at")
    .order("updated_at", { ascending: false })
    .limit(max);

  if (pErr || !profiles) {
    return { ok: false, error: pErr?.message ?? "Failed to load profiles" };
  }

  const rows = await mapLimit(profiles as { id: string }[], 12, async (p) => {
    const id = String(p.id);
    let email: string | null = null;
    try {
      const { data, error } = await admin.auth.admin.getUserById(id);
      if (!error && data.user) email = data.user.email ?? null;
    } catch {
      email = null;
    }
    const raw = p as {
      role?: string;
      display_name?: string | null;
      updated_at?: string | null;
    };
    return {
      id,
      email,
      role: String(raw.role ?? "member"),
      displayName: raw.display_name ?? null,
      updatedAt: raw.updated_at ?? null,
    };
  });

  return { ok: true, rows };
}
