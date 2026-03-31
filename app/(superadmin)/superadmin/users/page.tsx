import { getSuperAdminUsers } from "@/src/features/superadmin/queries/get-superadmin-users";

export default async function SuperAdminUsersPage() {
  const res = await getSuperAdminUsers(120);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Profiles + auth email (batched). Suspend, roles, impersonation — spec §12.
        </p>
      </header>

      {!res.ok ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {res.error}
        </div>
      ) : res.rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-center text-sm text-zinc-500">
          No users.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25 text-sm shadow-xl shadow-black/30">
          <div className="grid grid-cols-12 border-b border-white/10 bg-black/40 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <span className="col-span-4">Email</span>
            <span className="col-span-3">Display</span>
            <span className="col-span-2">Role</span>
            <span className="col-span-3 text-right">Updated</span>
          </div>
          {res.rows.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-12 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.02]"
            >
              <span className="col-span-4 truncate text-zinc-200">
                {u.email ? u.email : <span className="text-zinc-600">—</span>}
              </span>
              <span className="col-span-3 truncate text-zinc-400">
                {u.displayName ?? "—"}
              </span>
              <span className="col-span-2">
                <span
                  className={
                    u.role === "super_admin"
                      ? "text-amber-300"
                      : u.role === "admin"
                        ? "text-violet-300"
                        : "text-zinc-400"
                  }
                >
                  {u.role}
                </span>
              </span>
              <span className="col-span-3 text-right text-xs text-zinc-500">
                {u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
