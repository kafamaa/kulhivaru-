export default async function SuperAdminOrganizationsPage() {
  const { getAdminOrganizations } = await import(
    "@/src/features/admin/queries/get-admin-organizations"
  );
  const res = await getAdminOrganizations(200);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Organizations</h1>
        <p className="mt-1 text-sm text-zinc-400">
          All organizations. Detail pages, filters, and bulk actions — spec §8.
        </p>
      </header>

      {!res.ok ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {res.error}
        </div>
      ) : res.rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-center text-sm text-zinc-500">
          No organizations.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25 text-sm shadow-xl shadow-black/30">
          <div className="grid grid-cols-4 border-b border-white/10 bg-black/40 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <span>Name</span>
            <span>Slug</span>
            <span>Owner</span>
            <span className="text-right">Created</span>
          </div>
          {res.rows.map((org) => (
            <div
              key={org.id}
              className="grid grid-cols-4 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.02]"
            >
              <span className="font-medium text-zinc-100">{org.name}</span>
              <span className="font-mono text-xs text-zinc-400">{org.slug}</span>
              <span className="font-mono text-xs text-zinc-500">
                {org.ownerId ? `${org.ownerId.slice(0, 8)}…` : "—"}
              </span>
              <span className="text-right text-xs text-zinc-500">
                {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
