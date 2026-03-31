import "server-only";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export interface AdminOrgListFilters {
  q?: string;
  status?: "" | "active" | "suspended" | "archived";
  verification?: "" | "verified" | "unverified" | "pending";
  created_from?: string;
  created_to?: string;
  has_tournaments?: "" | "any" | "yes" | "no";
  high_risk?: "" | "any" | "yes" | "no";
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

/** Build list filters from Next.js `searchParams` (App Router). */
export function adminOrgListFiltersFromSearchParams(
  sp: Record<string, string | string[] | undefined>
): AdminOrgListFilters {
  const status = firstParam(sp.status) as AdminOrgListFilters["status"] | undefined;
  const verification = firstParam(sp.verification) as
   AdminOrgListFilters["verification"]
    | undefined;
  const has_tournaments = firstParam(sp.has_tournaments) as
    AdminOrgListFilters["has_tournaments"]
    | undefined;
  const high_risk = firstParam(sp.high_risk) as AdminOrgListFilters["high_risk"] | undefined;

  return {
    q: firstParam(sp.q) ?? "",
    status: status && ["active", "suspended", "archived"].includes(status) ? status : "",
    verification:
      verification && ["verified", "unverified", "pending"].includes(verification)
        ? verification
        : "",
    created_from: firstParam(sp.created_from) ?? "",
    created_to: firstParam(sp.created_to) ?? "",
    has_tournaments:
      has_tournaments && ["any", "yes", "no"].includes(has_tournaments) ? has_tournaments : "",
    high_risk: high_risk && ["any", "yes", "no"].includes(high_risk) ? high_risk : "",
  };
}

export interface AdminOrgListRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  org_status: string;
  verification_status: string;
  last_active_at: string | null;
  risk_flag_count: number;
  members_count: number;
  tournaments_count: number;
  active_tournaments_count: number;
  revenue_collected: number;
  owner_display_name: string | null;
}

export interface AdminOrgListSummary {
  total: number;
  active: number;
  suspended: number;
  verified: number;
  with_active_tournaments: number;
}

export async function rpcAdminListOrganizations(
  filters: AdminOrgListFilters
): Promise<
  { ok: true; summary: AdminOrgListSummary; rows: AdminOrgListRow[] } | { ok: false; error: string }
> {
  const supabase = await createSupabaseServerClient();
  // Admin RPCs — regenerate types after migrations include these functions.
  const { data, error } = await supabase.rpc(
    "rpc_admin_list_organizations" as never,
    {
      p_filters: {
        q: filters.q ?? "",
        status: filters.status ?? "",
        verification: filters.verification ?? "",
        created_from: filters.created_from ?? "",
        created_to: filters.created_to ?? "",
        has_tournaments: filters.has_tournaments ?? "",
        high_risk: filters.high_risk ?? "",
      },
    } as never
  );

  if (error) return { ok: false, error: error.message };

  const payload = data as {
    summary?: Record<string, number>;
    rows?: AdminOrgListRow[];
  } | null;
  if (!payload?.rows || !payload.summary) {
    return { ok: false, error: "Invalid response from rpc_admin_list_organizations" };
  }

  return {
    ok: true,
    summary: {
      total: Number(payload.summary.total ?? 0),
      active: Number(payload.summary.active ?? 0),
      suspended: Number(payload.summary.suspended ?? 0),
      verified: Number(payload.summary.verified ?? 0),
      with_active_tournaments: Number(payload.summary.with_active_tournaments ?? 0),
    },
    rows: payload.rows.map((r) => ({
      ...r,
      risk_flag_count: Number(r.risk_flag_count ?? 0),
      members_count: Number(r.members_count ?? 0),
      tournaments_count: Number(r.tournaments_count ?? 0),
      active_tournaments_count: Number(r.active_tournaments_count ?? 0),
      revenue_collected: Number(r.revenue_collected ?? 0),
    })),
  };
}

export type AdminOrganizationDetail = {
  organization: Record<string, unknown>;
  members: Array<
    Record<string, unknown> & { email?: string | null }
  >;
  tournaments: Record<string, unknown>[];
  audit: Record<string, unknown>[];
};

async function fallbackAdminGetOrganization(orgId: string): Promise<
  { ok: true; data: AdminOrganizationDetail } | { ok: false; error: string }
> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, error: "Fallback requires service role client" };
  }

  const [orgRes, membersRes, tournamentsRes, auditRes] = await Promise.all([
    admin
      .from("organizations")
      .select(
        "id,name,slug,owner_id,created_at,updated_at,org_status,verification_status,last_active_at,risk_flag_count,allow_finance_module,require_manual_publish_review,max_tournaments,hide_public_visibility,admin_notes,feature_restrictions_json"
      )
      .eq("id", orgId)
      .single(),
    admin
      .from("organization_members")
      .select("profile_id,role,status,joined_at,profiles(display_name,role)")
      .eq("organization_id", orgId)
      .order("joined_at", { ascending: true }),
    admin
      .from("tournaments")
      .select("id,name,slug,status,sport,created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
    admin
      .from("platform_admin_audit_log")
      .select("id,action,created_at,reason,before_json,after_json")
      .eq("entity_type", "organization")
      .eq("entity_id", orgId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const orgAny = orgRes as unknown as { data: Record<string, unknown> | null; error: { message: string } | null };
  const membersAny = membersRes as unknown as { data: unknown[] | null; error: { message: string } | null };
  const tournamentsAny = tournamentsRes as unknown as { data: unknown[] | null; error: { message: string } | null };
  const auditAny = auditRes as unknown as { data: unknown[] | null; error: { message: string } | null };

  if (orgAny.error) return { ok: false, error: orgAny.error.message };
  if (!orgAny.data) return { ok: false, error: "Organization not found" };
  if (membersAny.error) return { ok: false, error: membersAny.error.message };
  if (tournamentsAny.error) return { ok: false, error: tournamentsAny.error.message };
  if (auditAny.error) return { ok: false, error: auditAny.error.message };

  const membersRaw = (membersAny.data ?? []) as Array<Record<string, unknown>>;
  const members = membersRaw.map((m) => {
    const p = (m.profiles ?? {}) as Record<string, unknown>;
    return {
      profile_id: m.profile_id,
      role: m.role,
      member_status: m.status,
      joined_at: m.joined_at,
      display_name: p.display_name ?? null,
      platform_role: p.role ?? null,
    };
  });

  const tournamentsRaw = (tournamentsAny.data ?? []) as Array<Record<string, unknown>>;
  const tournaments = tournamentsRaw.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    status: t.status,
    sport: t.sport,
    // Keep response shape stable for UI.
    updated_at: t.created_at ?? null,
    teams_count: 0,
    matches_count: 0,
    revenue: 0,
  }));

  const organization = {
    ...(orgAny.data as Record<string, unknown>),
    members_count: members.length,
    tournaments_count: tournaments.length,
    active_tournaments_count: tournaments.filter(
      (t) => t.status === "upcoming" || t.status === "ongoing"
    ).length,
    teams_total: 0,
    revenue_collected: 0,
    owner_display_name: null,
  };

  return {
    ok: true,
    data: {
      organization,
      members: members as Array<Record<string, unknown> & { email?: string | null }>,
      tournaments: tournaments as Record<string, unknown>[],
      audit: (auditAny.data ?? []) as Record<string, unknown>[],
    },
  };
}

export async function rpcAdminGetOrganization(orgId: string): Promise<
  { ok: true; data: AdminOrganizationDetail } | { ok: false; error: string }
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "rpc_admin_get_organization" as never,
    { p_org_id: orgId } as never
  );

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("t.updated_at") || msg.includes("column") && msg.includes("updated_at")) {
      return fallbackAdminGetOrganization(orgId);
    }
    return { ok: false, error: error.message };
  }

  const payload = data as { ok?: boolean; error?: string } & AdminOrganizationDetail;
  if (payload && payload.ok === false) {
    return { ok: false, error: String(payload.error ?? "Not found") };
  }
  if (!payload?.organization) {
    return { ok: false, error: "Invalid response" };
  }

  const members = Array.isArray(payload.members) ? [...payload.members] : [];
  const admin = createSupabaseAdminClient();
  if (admin) {
    for (const m of members) {
      const pid = String(m.profile_id ?? "");
      if (!pid) continue;
      try {
        const { data: u } = await admin.auth.admin.getUserById(pid);
        m.email = u.user?.email ?? null;
      } catch {
        m.email = null;
      }
    }
  }

  return {
    ok: true,
    data: {
      organization: payload.organization as Record<string, unknown>,
      members,
      tournaments: (payload.tournaments as Record<string, unknown>[]) ?? [],
      audit: (payload.audit as Record<string, unknown>[]) ?? [],
    },
  };
}
