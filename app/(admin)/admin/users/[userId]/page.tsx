import Link from "next/link";
import { Suspense } from "react";
import { AdminUserDetailTabs } from "@/src/features/admin/components/admin-user-detail-tabs";
import { getSessionUser } from "@/src/lib/auth/session";
import { rpcAdminGetUser } from "@/src/features/admin/queries/admin-users-rpc";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const [res, session] = await Promise.all([rpcAdminGetUser(userId), getSessionUser()]);

  if (!res.ok) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/admin/users" className="text-xs font-semibold text-violet-400 hover:underline">
          ← Users
        </Link>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-100">
          {res.error}
        </div>
      </div>
    );
  }

  const display =
    res.data.profile.display_name != null && String(res.data.profile.display_name).trim()
      ? String(res.data.profile.display_name).trim()
      : res.data.auth.email ?? "User";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link href="/admin/users" className="text-xs font-semibold text-violet-400 hover:underline">
          ← Users
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">{display}</h1>
        <p className="mt-1 font-mono text-xs text-zinc-500">{userId}</p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-sm text-zinc-500">
            Loading…
          </div>
        }
      >
        <AdminUserDetailTabs
          userId={userId}
          initial={res.data}
          currentUserId={session?.id ?? null}
        />
      </Suspense>
    </div>
  );
}
