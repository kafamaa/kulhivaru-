import Link from "next/link";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  signInHref?: string;
}

export function AccessDenied({
  title = "Access denied",
  message = "You don’t have permission to view this page.",
  signInHref = "/",
}: AccessDeniedProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-center">
      <h1 className="text-xl font-semibold text-slate-50">{title}</h1>
      <p className="max-w-sm text-sm text-slate-400">{message}</p>
      <Link
        href={signInHref}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
      >
        {signInHref === "/" ? "Go to homepage" : "Sign in"}
      </Link>
    </div>
  );
}
