import Link from "next/link";

export function SuperAdminPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{description}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/25 p-6 text-sm text-zinc-500">
        <p>
          This module is specified in{" "}
          <code className="text-zinc-400">docs/SUPER_ADMIN_MASTER_SPEC.md</code> and
          will be implemented with filtered tables, RPC-only writes, confirmations,
          and audit logging.
        </p>
        <Link
          href="/superadmin"
          className="mt-4 inline-block text-amber-400 hover:text-amber-300"
        >
          ← Overview
        </Link>
      </div>
    </div>
  );
}
