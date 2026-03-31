import Link from "next/link";
import { AdminTournamentsTable } from "@/src/features/admin/components/admin-tournaments-table";
import { AdminTournamentsToolbar } from "@/src/features/admin/components/admin-tournaments-toolbar";
import { rpcAdminListOrganizations } from "@/src/features/admin/queries/admin-organizations-rpc";
import {
  adminTournamentListFiltersFromSearchParams,
  rpcAdminListTournaments,
} from "@/src/features/admin/queries/admin-tournaments-rpc";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = adminTournamentListFiltersFromSearchParams(sp);
  const [res, orgsRes] = await Promise.all([
    rpcAdminListTournaments(filters),
    rpcAdminListOrganizations({
      q: "",
      status: "",
      verification: "",
      created_from: "",
      created_to: "",
      has_tournaments: "",
      high_risk: "",
    }),
  ]);

  const orgOptions = orgsRes.ok ? orgsRes.rows : [];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tournaments</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage all tournaments across the platform
          </p>
        </div>
        <AdminTournamentsToolbar filters={filters} />
      </header>

      {!res.ok ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {res.error}
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            {(
              [
                ["Total", res.summary.total, "text-zinc-100"],
                ["Draft", res.summary.draft, "text-zinc-300"],
                ["Published", res.summary.published, "text-sky-300"],
                ["Live", res.summary.live, "text-emerald-300"],
                ["Completed", res.summary.completed, "text-violet-300"],
                ["Cancelled", res.summary.cancelled, "text-red-300/90"],
                ["Locked", res.summary.locked, "text-amber-200"],
                ["With issues", res.summary.with_issues, "text-amber-300"],
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
                <span className="text-zinc-500">Search name, slug, or organization</span>
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
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="min-w-[200px] space-y-1 text-xs">
                <span className="text-zinc-500">Organization</span>
                <select
                  name="organization_id"
                  defaultValue={filters.organization_id}
                  className="w-full max-w-xs rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any organization</option>
                  {orgOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Sport</span>
                <input
                  name="sport"
                  defaultValue={filters.sport}
                  placeholder="e.g. Football"
                  className="w-36 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Season</span>
                <input
                  name="season"
                  defaultValue={filters.season}
                  placeholder="Label"
                  className="w-36 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Start from</span>
                <input
                  type="date"
                  name="date_from"
                  defaultValue={filters.date_from}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Start to</span>
                <input
                  type="date"
                  name="date_to"
                  defaultValue={filters.date_to}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Has issues</span>
                <select
                  name="has_issues"
                  defaultValue={filters.has_issues}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Locked</span>
                <select
                  name="locked"
                  defaultValue={filters.locked}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="yes">Locked</option>
                  <option value="no">Unlocked</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">No fixtures</span>
                <select
                  name="has_no_fixtures"
                  defaultValue={filters.has_no_fixtures}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="yes">Published/live &amp; zero matches</option>
                  <option value="no">Has fixtures or not live</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Unpaid fees</span>
                <select
                  name="has_unpaid"
                  defaultValue={filters.has_unpaid}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="yes">Has unpaid receivables</option>
                  <option value="no">No unpaid receivables</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Featured</span>
                <select
                  name="featured"
                  defaultValue={filters.featured}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="yes">Featured</option>
                  <option value="no">Not featured</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Row limit</span>
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
                href="/admin/tournaments"
                className="rounded-lg border border-white/10 px-4 py-2 text-center text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                Reset filters
              </Link>
            </div>
          </form>

          {res.rows.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-12 text-center text-sm text-zinc-400">
              No tournaments match these filters.
            </div>
          ) : (
            <AdminTournamentsTable rows={res.rows} />
          )}
        </>
      )}
    </div>
  );
}
