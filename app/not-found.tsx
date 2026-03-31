import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-center"
      suppressHydrationWarning
    >
      <h1 className="text-2xl font-semibold text-slate-50">Page not found</h1>
      <p className="text-sm text-slate-400">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
      >
        Go to homepage
      </Link>
    </div>
  );
}
