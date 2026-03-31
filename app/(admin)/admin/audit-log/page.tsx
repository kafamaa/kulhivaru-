import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  const { getAdminAuditEvents } = await import(
    "@/src/features/admin/queries/get-admin-audit"
  );
  const res = await getAdminAuditEvents(80);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Audit log</h1>
        <p className="text-sm text-zinc-400">
          Activity derived from platform data (MVP). Full <strong className="text-zinc-300">platform admin</strong>{" "}
          actions also log to <code className="rounded bg-black/40 px-1 text-xs">platform_admin_audit_log</code>{" "}
          where RPCs are used.
        </p>
        <p className="text-xs text-zinc-600">
          Filters (date, action, user, entity) and row expansion (before/after, reason) — next iteration.
        </p>
      </header>

      {!res.ok ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {res.error}
        </div>
      ) : res.rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-sm text-zinc-400">
          No events yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-sm shadow-lg shadow-black/20">
          <div className="grid grid-cols-3 border-b border-white/10 bg-black/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>When</span>
            <span>Event</span>
            <span>Target</span>
          </div>
          {res.rows.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-3 border-b border-white/5 px-4 py-3 last:border-b-0 hover:bg-white/[0.03]"
            >
              <span className="text-xs text-zinc-400">
                {e.at ? new Date(e.at).toLocaleString() : "—"}
              </span>
              <span className="text-xs font-medium text-violet-200">{e.type}</span>
              <span className="truncate text-xs text-zinc-300">{e.target}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-zinc-500">
        Legacy path <code className="text-zinc-400">/admin/audit</code> redirects here.{" "}
        <Link href="/admin/organizations" className="text-violet-400 hover:underline">
          Organizations
        </Link>{" "}
        admin actions write structured audit rows via RPC.
      </div>
    </div>
  );
}
