import Link from "next/link";
import { AdminUsersTable } from "@/src/features/admin/components/admin-users-table";
import { AdminUsersToolbar } from "@/src/features/admin/components/admin-users-toolbar";
import { getSessionUser } from "@/src/lib/auth/session";
import {
  adminUserListFiltersFromSearchParams,
  rpcAdminListUsers,
} from "@/src/features/admin/queries/admin-users-rpc";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = adminUserListFiltersFromSearchParams(sp);
  const rawRoleParam = Array.isArray(sp.role) ? sp.role[0] : sp.role;
  const roleSelectDefault = rawRoleParam === "player" ? "player" : filters.role;
  const [res, session] = await Promise.all([rpcAdminListUsers(filters), getSessionUser()]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Users</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage all platform users and access</p>
        </div>
        <AdminUsersToolbar filters={filters} />
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
                ["Total users", res.summary.total, "text-zinc-100"],
                ["Active", res.summary.active, "text-emerald-300"],
                ["Suspended", res.summary.suspended, "text-amber-300"],
                ["Organizers", res.summary.organizers, "text-sky-300"],
                ["Super admins", res.summary.super_admins, "text-fuchsia-300"],
                ["Joined (7d)", res.summary.recently_joined, "text-violet-300"],
                ["Never logged in", res.summary.never_logged_in, "text-zinc-400"],
                ["Flagged", res.summary.flagged, "text-red-300/90"],
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
                <span className="text-zinc-500">Search name or email</span>
                <input
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Search…"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/40"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Platform role</span>
                <select
                  name="role"
                  defaultValue={roleSelectDefault}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="super_admin">Super admin</option>
                  <option value="admin">Admin</option>
                  <option value="organizer">Organizer</option>
                  <option value="member">Member</option>
                  <option value="player">Player (member)</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Account status</span>
                <select
                  name="status"
                  defaultValue={filters.status}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="invited">Invited</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Email verified</span>
                <select
                  name="email_verified"
                  defaultValue={filters.email_verified}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="yes">Verified</option>
                  <option value="no">Unverified</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Organizations</span>
                <select
                  name="has_orgs"
                  defaultValue={filters.has_orgs}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="yes">Has organizations</option>
                  <option value="no">No organizations</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Flagged (risk)</span>
                <select
                  name="flagged"
                  defaultValue={filters.flagged}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Any</option>
                  <option value="yes">Flagged</option>
                  <option value="no">Not flagged</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <input type="checkbox" name="recent_created" value="yes" defaultChecked={filters.recent_created === "yes"} />
                Recently created (7d)
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
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Last login from</span>
                <input
                  type="datetime-local"
                  name="last_login_from"
                  defaultValue={filters.last_login_from}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-zinc-500">Last login to</span>
                <input
                  type="datetime-local"
                  name="last_login_to"
                  defaultValue={filters.last_login_to}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
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
                href="/admin/users"
                className="rounded-lg border border-white/10 px-4 py-2 text-center text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                Reset filters
              </Link>
            </div>
          </form>

          {res.rows.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-12 text-center text-sm text-zinc-400">
              No users match these filters.
            </div>
          ) : (
            <AdminUsersTable rows={res.rows} currentUserId={session?.id ?? null} />
          )}
        </>
      )}
    </div>
  );
}
