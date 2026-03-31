import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <h1 className="text-xl font-bold text-red-100">Unauthorized</h1>
        <p className="mt-3 text-sm text-red-200/80">
          You don&apos;t have permission to access this area. Super Admin requires
          the <code className="rounded bg-black/30 px-1">super_admin</code> role on your
          profile.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10"
          >
            Home
          </Link>
          <Link
            href="/organizer"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10"
          >
            Organizer
          </Link>
        </div>
      </div>
    </div>
  );
}
