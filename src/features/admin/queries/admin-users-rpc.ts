import "server-only";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type AdminUserListFilters = {
  q: string;
  role: "" | "super_admin" | "admin" | "organizer" | "member";
  status: "" | "active" | "suspended" | "invited" | "archived";
  email_verified: "" | "yes" | "no";
  has_orgs: "" | "yes" | "no";
  flagged: "" | "yes" | "no";
  recent_created: "" | "yes";
  created_from: string;
  created_to: string;
  last_login_from: string;
  last_login_to: string;
  limit: number;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function adminUserListFiltersFromSearchParams(
  sp: Record<string, string | string[] | undefined>
): AdminUserListFilters {
  const role = firstParam(sp.role) as AdminUserListFilters["role"] | undefined;
  const status = firstParam(sp.status) as AdminUserListFilters["status"] | undefined;
  const email_verified = firstParam(sp.email_verified) as
    | AdminUserListFilters["email_verified"]
    | undefined;
  const has_orgs = firstParam(sp.has_orgs) as AdminUserListFilters["has_orgs"] | undefined;
  const flagged = firstParam(sp.flagged) as AdminUserListFilters["flagged"] | undefined;
  const recent_created = firstParam(sp.recent_created) as
    | AdminUserListFilters["recent_created"]
    | undefined;

  const limRaw = firstParam(sp.limit);
  const limit = limRaw ? Number(limRaw) : 200;

  const roleNorm: AdminUserListFilters["role"] =
    role && ["super_admin", "admin", "organizer", "member", "player"].includes(role ?? "")
      ? role === "player"
        ? "member"
        : (role as AdminUserListFilters["role"])
      : "";

  return {
    q: firstParam(sp.q) ?? "",
    role: roleNorm,
    status:
      status && ["active", "suspended", "invited", "archived"].includes(status) ? status : "",
    email_verified: email_verified && ["yes", "no"].includes(email_verified) ? email_verified : "",
    has_orgs: has_orgs && ["yes", "no"].includes(has_orgs) ? has_orgs : "",
    flagged: flagged && ["yes", "no"].includes(flagged) ? flagged : "",
    recent_created: recent_created === "yes" ? "yes" : "",
    created_from: firstParam(sp.created_from) ?? "",
    created_to: firstParam(sp.created_to) ?? "",
    last_login_from: firstParam(sp.last_login_from) ?? "",
    last_login_to: firstParam(sp.last_login_to) ?? "",
    limit: Number.isFinite(limit) ? Math.min(500, Math.max(1, limit)) : 200,
  };
}

export interface AdminUserListRow {
  id: string;
  display_name: string | null;
  email: string;
  phone: string | null;
  role: string;
  account_status: string;
  email_verified: boolean;
  org_count: number;
  tournament_touch_count: number;
  risk_flag_count: number;
  issue_count: number;
  last_sign_in_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminUserListSummary {
  total: number;
  active: number;
  suspended: number;
  organizers: number;
  super_admins: number;
  recently_joined: number;
  never_logged_in: number;
  flagged: number;
}

export async function rpcAdminListUsers(
  filters: AdminUserListFilters
): Promise<
  { ok: true; summary: AdminUserListSummary; rows: AdminUserListRow[] } | { ok: false; error: string }
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "rpc_admin_list_users" as never,
    {
      p_filters: {
        q: filters.q ?? "",
        role: filters.role ?? "",
        status: filters.status ?? "",
        email_verified: filters.email_verified ?? "",
        has_orgs: filters.has_orgs ?? "",
        flagged: filters.flagged ?? "",
        recent_created: filters.recent_created ?? "",
        created_from: filters.created_from ?? "",
        created_to: filters.created_to ?? "",
        last_login_from: filters.last_login_from ?? "",
        last_login_to: filters.last_login_to ?? "",
        limit: String(filters.limit ?? 200),
      },
    } as never
  );

  if (error) return { ok: false, error: error.message };

  const payload = data as {
    summary?: Record<string, number>;
    rows?: AdminUserListRow[];
  } | null;
  if (!payload?.rows || !payload.summary) {
    return { ok: false, error: "Invalid response from rpc_admin_list_users" };
  }

  return {
    ok: true,
    summary: {
      total: Number(payload.summary.total ?? 0),
      active: Number(payload.summary.active ?? 0),
      suspended: Number(payload.summary.suspended ?? 0),
      organizers: Number(payload.summary.organizers ?? 0),
      super_admins: Number(payload.summary.super_admins ?? 0),
      recently_joined: Number(payload.summary.recently_joined ?? 0),
      never_logged_in: Number(payload.summary.never_logged_in ?? 0),
      flagged: Number(payload.summary.flagged ?? 0),
    },
    rows: payload.rows.map((r) => ({
      ...r,
      email_verified: Boolean(r.email_verified),
      org_count: Number(r.org_count ?? 0),
      tournament_touch_count: Number(r.tournament_touch_count ?? 0),
      risk_flag_count: Number(r.risk_flag_count ?? 0),
      issue_count: Number(r.issue_count ?? 0),
    })),
  };
}

export type AdminUserDetail = {
  profile: Record<string, unknown>;
  auth: {
    email: string | null;
    phone: string | null;
    email_verified: boolean;
    created_at: string | null;
    last_sign_in_at: string | null;
  };
  memberships: Array<Record<string, unknown>>;
  tournaments: Array<Record<string, unknown>>;
  audit_as_target: Array<Record<string, unknown>>;
  audit_as_actor: Array<Record<string, unknown>>;
};

export async function rpcAdminGetUser(
  userId: string
): Promise<{ ok: true; data: AdminUserDetail } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "rpc_admin_get_user" as never,
    { p_user_id: userId } as never
  );

  if (error) return { ok: false, error: error.message };

  const payload = data as AdminUserDetail | null;
  if (!payload?.profile) {
    return { ok: false, error: "Invalid response from rpc_admin_get_user" };
  }

  const auth = payload.auth ?? {};
  return {
    ok: true,
    data: {
      profile: payload.profile,
      auth: {
        email: auth.email != null ? String(auth.email) : null,
        phone: auth.phone != null ? String(auth.phone) : null,
        email_verified: Boolean(auth.email_verified),
        created_at: auth.created_at != null ? String(auth.created_at) : null,
        last_sign_in_at: auth.last_sign_in_at != null ? String(auth.last_sign_in_at) : null,
      },
      memberships: Array.isArray(payload.memberships) ? payload.memberships : [],
      tournaments: Array.isArray(payload.tournaments) ? payload.tournaments : [],
      audit_as_target: Array.isArray(payload.audit_as_target) ? payload.audit_as_target : [],
      audit_as_actor: Array.isArray(payload.audit_as_actor) ? payload.audit_as_actor : [],
    },
  };
}
