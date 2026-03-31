import Link from "next/link";
import { AdminRegistrationsTable } from "@/src/features/admin/components/admin-registrations-table";
import { AdminRegistrationsToolbar } from "@/src/features/admin/components/admin-registrations-toolbar";
import { rpcAdminListOrganizations } from "@/src/features/admin/queries/admin-organizations-rpc";
import {
  adminRegistrationListFiltersFromSearchParams,
  rpcAdminListRegistrations,
} from "@/src/features/admin/queries/admin-registrations-rpc";
import { rpcAdminListTournaments } from "@/src/features/admin/queries/admin-tournaments-rpc";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = adminRegistrationListFiltersFromSearchParams(sp);

  const emptyOrgFilters = {
    q: "",
    status: "" as const,
    verification: "" as const,
    created_from: "",
    created_to: "",
    has_tournaments: "" as const,
    high_risk: "" as const,
  };

  const [res, orgsRes, tourRes] = await Promise.all([
    rpcAdminListRegistrations(filters),
    rpcAdminListOrganizations(emptyOrgFilters),
    rpcAdminListTournaments({
      q: "",
      status: "",
      organization_id: "",
      sport: "",
      season: "",
      date_from: "",
      date_to: "",
      has_issues: "",
      locked: "",
      has_no_fixtures: "",
      has_unpaid: "",
      featured: "",
      limit: 300,
    }),
  ]);

  const orgOptions = orgsRes.ok ? orgsRes.rows : [];
  const tournamentOptions = tourRes.ok ? tourRes.rows : [];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Registrations</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Cross-tournament team entries, approvals, and payment control
          </p>
        </div>
        <AdminRegistrationsToolbar filters={filters} />
      </header>

      {!res.ok ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {res.error}
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10">
            {(
              [
                ["Total", res.summary.total, "text-zinc-100"],
                ["Pending", res.summary.pending, "text-amber-200"],
                ["Approved", res.summary.approved, "text-emerald-300"],
                ["Rejected", res.summary.rejected, "text-red-300/90"],
                ["Cancelled / withdrawn", res.summary.cancelled, "text-zinc-400"],
                ["Paid", res.summary.paid, "text-emerald-200"],
                ["Unpaid", res.summary.unpaid, "text-zinc-300"],
                ["Partial", res.summary.partial, "text-sky-300"],
                ["Waived", res.summary.waived, "text-violet-300"],
                ["Voided", res.summary.voided, "text-orange-300/90"],
                ["Dup suspects", res.summary.duplicate_suspects, "text-orange-200"],
                ["Flagged / attention", res.summary.flagged, "text-amber-300"],
              ] as const
            ).map(([label, value, tone]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 shadow-lg shadow-black/20"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
              </div>
            ))}
          </section>

          <form
            method="get"
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[200px] flex-1 space-y-1 text-xs">
                <span className="text-zinc-500">Search</span>
                <input
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Tournament, team, org, category, entry id…"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/40"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Entry status</span>
                <select
                  name="entry_status"
                  defaultValue={filters.entry_status}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Payment</span>
                <select
                  name="payment"
                  defaultValue={filters.payment}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="waived">Waived</option>
                  <option value="voided">Voided</option>
                  <option value="none">No receivable</option>
                </select>
              </label>
              <label className="min-w-[200px] space-y-1 text-xs">
                <span className="text-zinc-500">Tournament</span>
                <select
                  name="tournament_id"
                  defaultValue={filters.tournament_id}
                  className="w-full max-w-xs rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  {tournamentOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="min-w-[200px] space-y-1 text-xs">
                <span className="text-zinc-500">Organization</span>
                <select
                  name="organization_id"
                  defaultValue={filters.organization_id}
                  className="w-full max-w-xs rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  {orgOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Category ID</span>
                <input
                  name="category_id"
                  defaultValue={filters.category_id}
                  placeholder="uuid"
                  className="w-52 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white outline-none"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Sport</span>
                <input
                  name="sport"
                  defaultValue={filters.sport}
                  className="w-36 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Submitted from</span>
                <input
                  type="datetime-local"
                  name="submitted_from"
                  defaultValue={filters.submitted_from}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Submitted to</span>
                <input
                  type="datetime-local"
                  name="submitted_to"
                  defaultValue={filters.submitted_to}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Reviewed by (profile id)</span>
                <input
                  name="reviewed_by"
                  defaultValue={filters.reviewed_by}
                  className="w-52 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white outline-none"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Has flags</span>
                <select
                  name="has_flags"
                  defaultValue={filters.has_flags}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Duplicate suspects</span>
                <select
                  name="duplicate_suspects"
                  defaultValue={filters.duplicate_suspects}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Needs attention</span>
                <select
                  name="requires_attention"
                  defaultValue={filters.requires_attention}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Limit</span>
                <input
                  type="number"
                  name="limit"
                  min={1}
                  max={500}
                  defaultValue={String(filters.limit)}
                  className="w-24 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Apply filters
              </button>
              <Link
                href="/admin/registrations"
                className="rounded-lg border border-white/10 px-4 py-2 text-center text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                Reset filters
              </Link>
            </div>
          </form>

          {res.rows.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-12 text-center text-sm text-zinc-400">
              No registrations match these filters.
            </div>
          ) : (
            <AdminRegistrationsTable rows={res.rows} />
          )}
        </>
      )}
    </div>
  );
}
