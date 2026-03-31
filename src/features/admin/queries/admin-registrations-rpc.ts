import "server-only";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type AdminRegistrationListFilters = {
  q: string;
  entry_status: "" | "pending" | "approved" | "rejected" | "cancelled" | "withdrawn";
  payment: "" | "paid" | "unpaid" | "partial" | "waived" | "voided" | "none";
  tournament_id: string;
  organization_id: string;
  category_id: string;
  sport: string;
  submitted_from: string;
  submitted_to: string;
  reviewed_by: string;
  has_flags: "" | "yes" | "no";
  duplicate_suspects: "" | "yes" | "no";
  requires_attention: "" | "yes" | "no";
  limit: number;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function adminRegistrationListFiltersFromSearchParams(
  sp: Record<string, string | string[] | undefined>
): AdminRegistrationListFilters {
  const limRaw = firstParam(sp.limit);
  const limit = limRaw ? Number(limRaw) : 200;

  return {
    q: firstParam(sp.q) ?? "",
    entry_status: (firstParam(sp.entry_status) as AdminRegistrationListFilters["entry_status"]) || "",
    payment: (firstParam(sp.payment) as AdminRegistrationListFilters["payment"]) || "",
    tournament_id: firstParam(sp.tournament_id) ?? "",
    organization_id: firstParam(sp.organization_id) ?? "",
    category_id: firstParam(sp.category_id) ?? "",
    sport: firstParam(sp.sport) ?? "",
    submitted_from: firstParam(sp.submitted_from) ?? "",
    submitted_to: firstParam(sp.submitted_to) ?? "",
    reviewed_by: firstParam(sp.reviewed_by) ?? "",
    has_flags: (firstParam(sp.has_flags) as AdminRegistrationListFilters["has_flags"]) || "",
    duplicate_suspects: (firstParam(sp.duplicate_suspects) as AdminRegistrationListFilters["duplicate_suspects"]) || "",
    requires_attention: (firstParam(sp.requires_attention) as AdminRegistrationListFilters["requires_attention"]) || "",
    limit: Number.isFinite(limit) ? Math.min(500, Math.max(1, limit)) : 200,
  };
}

export interface AdminRegistrationListRow {
  id: string;
  tournament_id: string;
  tournament_name: string;
  tournament_slug: string;
  sport: string;
  organization_id: string | null;
  organization_name: string | null;
  team_id: string;
  team_name: string;
  team_slug: string;
  category_id: string | null;
  category_name: string | null;
  entry_status: string;
  payment_bucket: string;
  receivable_id: string | null;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  receivable_status: string | null;
  created_at: string | null;
  updated_at: string | null;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  issue_count: number;
  duplicate_name_suspect: boolean;
  admin_notes: string | null;
}

export interface AdminRegistrationListSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  paid: number;
  unpaid: number;
  waived: number;
  partial: number;
  voided: number;
  duplicate_suspects: number;
  flagged: number;
}

export async function rpcAdminListRegistrations(
  filters: AdminRegistrationListFilters
): Promise<
  | { ok: true; summary: AdminRegistrationListSummary; rows: AdminRegistrationListRow[] }
  | { ok: false; error: string }
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "rpc_admin_list_registrations" as never,
    {
      p_filters: {
        q: filters.q ?? "",
        entry_status: filters.entry_status ?? "",
        payment: filters.payment ?? "",
        tournament_id: filters.tournament_id ?? "",
        organization_id: filters.organization_id ?? "",
        category_id: filters.category_id ?? "",
        sport: filters.sport ?? "",
        submitted_from: filters.submitted_from ?? "",
        submitted_to: filters.submitted_to ?? "",
        reviewed_by: filters.reviewed_by ?? "",
        has_flags: filters.has_flags ?? "",
        duplicate_suspects: filters.duplicate_suspects ?? "",
        requires_attention: filters.requires_attention ?? "",
        limit: String(filters.limit ?? 200),
      },
    } as never
  );

  if (error) return { ok: false, error: error.message };

  const payload = data as {
    summary?: Record<string, number>;
    rows?: AdminRegistrationListRow[];
  } | null;
  if (!payload?.rows || !payload.summary) {
    return { ok: false, error: "Invalid response from rpc_admin_list_registrations" };
  }

  return {
    ok: true,
    summary: {
      total: Number(payload.summary.total ?? 0),
      pending: Number(payload.summary.pending ?? 0),
      approved: Number(payload.summary.approved ?? 0),
      rejected: Number(payload.summary.rejected ?? 0),
      cancelled: Number(payload.summary.cancelled ?? 0),
      paid: Number(payload.summary.paid ?? 0),
      unpaid: Number(payload.summary.unpaid ?? 0),
      waived: Number(payload.summary.waived ?? 0),
      partial: Number(payload.summary.partial ?? 0),
      voided: Number(payload.summary.voided ?? 0),
      duplicate_suspects: Number(payload.summary.duplicate_suspects ?? 0),
      flagged: Number(payload.summary.flagged ?? 0),
    },
    rows: payload.rows.map((r) => ({
      ...r,
      amount_due: Number(r.amount_due ?? 0),
      amount_paid: Number(r.amount_paid ?? 0),
      amount_remaining: Number(r.amount_remaining ?? 0),
      issue_count: Number(r.issue_count ?? 0),
      duplicate_name_suspect: Boolean(r.duplicate_name_suspect),
    })),
  };
}

export type AdminRegistrationDetail = {
  entry: Record<string, unknown>;
  tournament: Record<string, unknown>;
  organization: Record<string, unknown> | null;
  team: Record<string, unknown>;
  category: Record<string, unknown> | null;
  receivable: Record<string, unknown> | null;
  payment_bucket: string;
  reviewed_by_name: string | null;
  payments: Array<Record<string, unknown>>;
  audit: Array<Record<string, unknown>>;
  validation_issues: unknown[];
};

export async function rpcAdminGetRegistration(
  entryId: string
): Promise<{ ok: true; data: AdminRegistrationDetail } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "rpc_admin_get_registration" as never,
    { p_entry_id: entryId } as never
  );

  if (error) return { ok: false, error: error.message };

  const payload = data as AdminRegistrationDetail | null;
  if (!payload?.entry) {
    return { ok: false, error: "Invalid response from rpc_admin_get_registration" };
  }

  return {
    ok: true,
    data: {
      ...payload,
      payments: Array.isArray(payload.payments) ? payload.payments : [],
      audit: Array.isArray(payload.audit) ? payload.audit : [],
      validation_issues: Array.isArray(payload.validation_issues) ? payload.validation_issues : [],
    },
  };
}
