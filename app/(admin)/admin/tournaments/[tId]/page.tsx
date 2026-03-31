import Link from "next/link";
import { Suspense } from "react";
import { AdminTournamentDetailTabs } from "@/src/features/admin/components/admin-tournament-detail-tabs";
import { rpcAdminGetTournament } from "@/src/features/admin/queries/admin-tournaments-rpc";

export const dynamic = "force-dynamic";

export default async function AdminTournamentDetailPage({
  params,
}: {
  params: Promise<{ tId: string }>;
}) {
  const { tId } = await params;
  const res = await rpcAdminGetTournament(tId);

  if (!res.ok) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/admin/tournaments"
          className="text-xs font-semibold text-violet-400 hover:underline"
        >
          ← Tournaments
        </Link>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-100">
          {res.error}
        </div>
      </div>
    );
  }

  const name =
    res.data.tournament.name != null ? String(res.data.tournament.name) : "Tournament";
  const slug = res.data.tournament.slug != null ? String(res.data.tournament.slug) : "";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/tournaments"
            className="text-xs font-semibold text-violet-400 hover:underline"
          >
            ← Tournaments
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">{name}</h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">{tId}</p>
          {slug ? (
            <Link
              href={`/t/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-sky-400 hover:underline"
            >
              Open public page ↗
            </Link>
          ) : null}
        </div>
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-sm text-zinc-500">
            Loading…
          </div>
        }
      >
        <AdminTournamentDetailTabs tournamentId={tId} initial={res.data} />
      </Suspense>
    </div>
  );
}
