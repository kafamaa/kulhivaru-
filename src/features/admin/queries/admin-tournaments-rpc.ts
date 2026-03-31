import "server-only";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type AdminTournamentListFilters = {
  q: string;
  status: "" | "draft" | "published" | "live" | "completed" | "cancelled" | "archived";
  organization_id: string;
  sport: string;
  season: string;
  date_from: string;
  date_to: string;
  has_issues: "" | "yes" | "no" | "any";
  locked: "" | "yes" | "no" | "any";
  has_no_fixtures: "" | "yes" | "no" | "any";
  has_unpaid: "" | "yes" | "no" | "any";
  featured: "" | "yes" | "no" | "any";
  limit: number;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function adminTournamentListFiltersFromSearchParams(
  sp: Record<string, string | string[] | undefined>
): AdminTournamentListFilters {
  const status = firstParam(sp.status) as AdminTournamentListFilters["status"] | undefined;
  const has_issues = firstParam(sp.has_issues) as AdminTournamentListFilters["has_issues"] | undefined;
  const locked = firstParam(sp.locked) as AdminTournamentListFilters["locked"] | undefined;
  const has_no_fixtures = firstParam(sp.has_no_fixtures) as
    | AdminTournamentListFilters["has_no_fixtures"]
    | undefined;
  const has_unpaid = firstParam(sp.has_unpaid) as AdminTournamentListFilters["has_unpaid"] | undefined;
  const featured = firstParam(sp.featured) as AdminTournamentListFilters["featured"] | undefined;

  const limRaw = firstParam(sp.limit);
  const limit = limRaw ? Number(limRaw) : 200;

  return {
    q: firstParam(sp.q) ?? "",
    status:
      status &&
      ["draft", "published", "live", "completed", "cancelled", "archived"].includes(status)
        ? status
        : "",
    organization_id: firstParam(sp.organization_id) ?? "",
    sport: firstParam(sp.sport) ?? "",
    season: firstParam(sp.season) ?? "",
    date_from: firstParam(sp.date_from) ?? "",
    date_to: firstParam(sp.date_to) ?? "",
    has_issues:
      has_issues && ["yes", "no", "any"].includes(has_issues) ? has_issues : "",
    locked: locked && ["yes", "no", "any"].includes(locked) ? locked : "",
    has_no_fixtures:
      has_no_fixtures && ["yes", "no", "any"].includes(has_no_fixtures) ? has_no_fixtures : "",
    has_unpaid: has_unpaid && ["yes", "no", "any"].includes(has_unpaid) ? has_unpaid : "",
    featured: featured && ["yes", "no", "any"].includes(featured) ? featured : "",
    limit: Number.isFinite(limit) ? Math.min(500, Math.max(1, limit)) : 200,
  };
}

export interface AdminTournamentListRow {
  id: string;
  name: string;
  slug: string;
  sport: string;
  location: string | null;
  season_label: string | null;
  status: string;
  organization_id: string | null;
  organization_name: string | null;
  is_featured: boolean;
  is_registration_open: boolean;
  admin_locked: boolean;
  visibility: string;
  categories_count: number;
  teams_approved_count: number;
  registrations_count: number;
  matches_count: number;
  fees_collected: number;
  unpaid_receivables_count: number;
  issue_count: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminTournamentListSummary {
  total: number;
  draft: number;
  published: number;
  live: number;
  completed: number;
  cancelled: number;
  locked: number;
  with_issues: number;
}

export async function rpcAdminListTournaments(
  filters: AdminTournamentListFilters
): Promise<
  | { ok: true; summary: AdminTournamentListSummary; rows: AdminTournamentListRow[] }
  | { ok: false; error: string }
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "rpc_admin_list_tournaments" as never,
    {
      p_filters: {
        q: filters.q ?? "",
        status: filters.status ?? "",
        organization_id: filters.organization_id ?? "",
        sport: filters.sport ?? "",
        season: filters.season ?? "",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
        has_issues: filters.has_issues ?? "",
        locked: filters.locked ?? "",
        has_no_fixtures: filters.has_no_fixtures ?? "",
        has_unpaid: filters.has_unpaid ?? "",
        featured: filters.featured ?? "",
        limit: String(filters.limit ?? 200),
      },
    } as never
  );

  if (error) return { ok: false, error: error.message };

  const payload = data as {
    summary?: Record<string, number>;
    rows?: AdminTournamentListRow[];
  } | null;
  if (!payload?.rows || !payload.summary) {
    return { ok: false, error: "Invalid response from rpc_admin_list_tournaments" };
  }

  return {
    ok: true,
    summary: {
      total: Number(payload.summary.total ?? 0),
      draft: Number(payload.summary.draft ?? 0),
      published: Number(payload.summary.published ?? 0),
      live: Number(payload.summary.live ?? 0),
      completed: Number(payload.summary.completed ?? 0),
      cancelled: Number(payload.summary.cancelled ?? 0),
      locked: Number(payload.summary.locked ?? 0),
      with_issues: Number(payload.summary.with_issues ?? 0),
    },
    rows: payload.rows.map((r) => ({
      ...r,
      categories_count: Number(r.categories_count ?? 0),
      teams_approved_count: Number(r.teams_approved_count ?? 0),
      registrations_count: Number(r.registrations_count ?? 0),
      matches_count: Number(r.matches_count ?? 0),
      fees_collected: Number(r.fees_collected ?? 0),
      unpaid_receivables_count: Number(r.unpaid_receivables_count ?? 0),
      issue_count: Number(r.issue_count ?? 0),
      is_featured: Boolean(r.is_featured),
      is_registration_open: Boolean(r.is_registration_open),
      admin_locked: Boolean(r.admin_locked),
    })),
  };
}

export type AdminTournamentDetail = {
  tournament: Record<string, unknown>;
  organization: Record<string, unknown> | null;
  counts: Record<string, number>;
  categories: Array<Record<string, unknown>>;
  audit: Array<Record<string, unknown>>;
};

export async function rpcAdminGetTournament(
  tournamentId: string
): Promise<{ ok: true; data: AdminTournamentDetail } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "rpc_admin_get_tournament" as never,
    { p_tournament_id: tournamentId } as never
  );

  if (error) return { ok: false, error: error.message };

  const payload = data as AdminTournamentDetail | null;
  if (!payload?.tournament) {
    return { ok: false, error: "Invalid response from rpc_admin_get_tournament" };
  }

  return {
    ok: true,
    data: {
      tournament: payload.tournament,
      organization: payload.organization ?? null,
      counts: {
        categories: Number((payload.counts as Record<string, unknown>)?.categories ?? 0),
        registrations: Number((payload.counts as Record<string, unknown>)?.registrations ?? 0),
        teams_approved: Number((payload.counts as Record<string, unknown>)?.teams_approved ?? 0),
        matches: Number((payload.counts as Record<string, unknown>)?.matches ?? 0),
        fees_collected: Number((payload.counts as Record<string, unknown>)?.fees_collected ?? 0),
        unpaid_receivables: Number(
          (payload.counts as Record<string, unknown>)?.unpaid_receivables ?? 0
        ),
      },
      categories: Array.isArray(payload.categories) ? payload.categories : [],
      audit: Array.isArray(payload.audit) ? payload.audit : [],
    },
  };
}

export { adminTournamentStatusLabel as adminTournamentDisplayStatus } from "../lib/admin-tournament-status-label";
