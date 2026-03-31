export default async function SuperAdminAuditLogsPage() {
  const { getAdminAuditEvents } = await import(
    "@/src/features/admin/queries/get-admin-audit"
  );
  const res = await getAdminAuditEvents(200);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Audit logs</h1>
        <p className="mt-1 text-sm text-zinc-400">
          MVP derived feed. Full immutable log + filters — spec §21 & §34.
        </p>
      </header>

      {!res.ok ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {res.error}
        </div>
      ) : res.rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-center text-sm text-zinc-500">
          No events.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25 text-sm shadow-xl shadow-black/30">
          <div className="grid grid-cols-3 border-b border-white/10 bg-black/40 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <span>When</span>
            <span>Event</span>
            <span>Target</span>
          </div>
          {res.rows.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-3 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.02]"
            >
              <span className="text-xs text-zinc-500">
                {e.at ? new Date(e.at).toLocaleString() : "—"}
              </span>
              <span className="text-xs font-medium text-amber-200/90">{e.type}</span>
              <span className="truncate text-xs text-zinc-300">{e.target}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
