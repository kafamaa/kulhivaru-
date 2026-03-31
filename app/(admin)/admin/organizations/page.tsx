import Link from "next/link";
import { AdminOrganizationsTable } from "@/src/features/admin/components/admin-organizations-table";
import { AdminOrganizationsToolbar } from "@/src/features/admin/components/admin-organizations-toolbar";
import {
  adminOrgListFiltersFromSearchParams,
  rpcAdminListOrganizations,
} from "@/src/features/admin/queries/admin-organizations-rpc";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = adminOrgListFiltersFromSearchParams(sp);
  const res = await rpcAdminListOrganizations(filters);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Organizations</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage all organizations on the platform
          </p>
        </div>
        <AdminOrganizationsToolbar filters={filters} />
      </header>

      {!res.ok ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {res.error}
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {(
              [
                ["Total organizations", res.summary.total, "text-zinc-100"],
                ["Active", res.summary.active, "text-emerald-300"],
                ["Suspended", res.summary.suspended, "text-amber-300"],
                ["Verified", res.summary.verified, "text-sky-300"],
                [
                  "With active tournaments",
                  res.summary.with_active_tournaments,
                  "text-violet-300",
                ],
              ] as const
            ).map(([label, value, tone]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 shadow-lg shadow-black/20"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {label}
                </p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
              </div>
            ))}
          </section>

          <form
            method="get"
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[180px] flex-1 space-y-1 text-xs">
                <span className="text-zinc-500">Search name / slug</span>
                <input
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Search…"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/40"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Status</span>
                <select
                  name="status"
                  defaultValue={filters.status}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Verification</span>
                <select
                  name="verification"
                  defaultValue={filters.verification}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                  <option value="pending">Pending</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Created from</span>
                <input
                  type="date"
                  name="created_from"
                  defaultValue={filters.created_from}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Created to</span>
                <input
                  type="date"
                  name="created_to"
                  defaultValue={filters.created_to}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Tournaments</span>
                <select
                  name="has_tournaments"
                  defaultValue={filters.has_tournaments}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="yes">Has tournaments</option>
                  <option value="no">No tournaments</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Risk / flagged</span>
                <select
                  name="high_risk"
                  defaultValue={filters.high_risk}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="yes">High-risk / flagged</option>
                  <option value="no">Not flagged</option>
                </select>
              </label>
              <button
                type="submit"
                className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Apply filters
              </button>
              <Link
                href="/admin/organizations"
                className="rounded-lg border border-white/10 px-4 py-2 text-center text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                Reset filters
              </Link>
            </div>
          </form>

          {res.rows.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-12 text-center text-sm text-zinc-400">
              No organizations match these filters.
            </div>
          ) : (
            <AdminOrganizationsTable rows={res.rows} />
          )}
        </>
      )}
    </div>
  );
}
