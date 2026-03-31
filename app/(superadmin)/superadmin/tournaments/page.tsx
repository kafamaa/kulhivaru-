import Link from "next/link";

export default async function SuperAdminTournamentsPage() {
  const { getAdminTournaments } = await import(
    "@/src/features/admin/queries/get-admin-tournaments"
  );
  const res = await getAdminTournaments(200);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Tournaments</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Global tournament index. Overrides, locks, and tools — spec §10–§11.
        </p>
      </header>

      {!res.ok ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {res.error}
        </div>
      ) : res.rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-center text-sm text-zinc-500">
          No tournaments.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25 text-sm shadow-xl shadow-black/30">
          <div className="grid grid-cols-5 border-b border-white/10 bg-black/40 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <span>Name</span>
            <span>Organization</span>
            <span>Sport</span>
            <span>Status</span>
            <span className="text-right">Created</span>
          </div>
          {res.rows.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-5 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.02]"
            >
              <span className="font-medium text-zinc-100">
                <Link
                  href={`/t/${t.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-300/90 hover:underline"
                >
                  {t.name}
                </Link>
              </span>
              <span className="text-xs text-zinc-400">{t.organizationName ?? "—"}</span>
              <span className="text-xs text-zinc-400">{t.sport}</span>
              <span>
                <span className="inline-flex rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
                  {t.status}
                </span>
              </span>
              <span className="text-right text-xs text-zinc-500">
                {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
