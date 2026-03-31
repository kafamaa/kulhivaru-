import Link from "next/link";
import { Suspense } from "react";
import { AdminRegistrationDetailTabs } from "@/src/features/admin/components/admin-registration-detail-tabs";
import { rpcAdminGetRegistration } from "@/src/features/admin/queries/admin-registrations-rpc";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationDetailPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await params;
  const res = await rpcAdminGetRegistration(entryId);

  if (!res.ok) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/admin/registrations"
          className="text-xs font-semibold text-violet-400 hover:underline"
        >
          ← Registrations
        </Link>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-100">
          {res.error}
        </div>
      </div>
    );
  }

  const teamName =
    res.data.team.name != null ? String(res.data.team.name) : "Registration";
  const tslug =
    res.data.tournament.slug != null ? String(res.data.tournament.slug) : "";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/admin/registrations"
          className="text-xs font-semibold text-violet-400 hover:underline"
        >
          ← Registrations
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">{teamName}</h1>
        <p className="mt-1 font-mono text-xs text-zinc-500">{entryId}</p>
        {tslug ? (
          <Link
            href={`/t/${tslug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-sky-400 hover:underline"
          >
            Public tournament ↗
          </Link>
        ) : null}
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-sm text-zinc-500">
            Loading…
          </div>
        }
      >
        <AdminRegistrationDetailTabs entryId={entryId} initial={res.data} />
      </Suspense>
    </div>
  );
}
