import Link from "next/link";
import { Suspense } from "react";
import { AdminOrganizationDetailTabs } from "@/src/features/admin/components/admin-organization-detail-tabs";
import { rpcAdminGetOrganization } from "@/src/features/admin/queries/admin-organizations-rpc";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const res = await rpcAdminGetOrganization(orgId);

  if (!res.ok) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/admin/organizations"
          className="text-xs font-semibold text-violet-400 hover:underline"
        >
          ← Organizations
        </Link>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-100">
          {res.error}
        </div>
      </div>
    );
  }

  const org = res.data.organization;
  const name = org.name != null ? String(org.name) : "Organization";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/admin/organizations"
          className="text-xs font-semibold text-violet-400 hover:underline"
        >
          ← Organizations
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">{name}</h1>
        <p className="mt-1 font-mono text-xs text-zinc-500">{orgId}</p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-sm text-zinc-500">
            Loading…
          </div>
        }
      >
        <AdminOrganizationDetailTabs orgId={orgId} initial={res.data} />
      </Suspense>
    </div>
  );
}
