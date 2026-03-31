import Link from "next/link";
import { LoginForm } from "@/src/features/auth/components/login-form";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error: queryError } = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-50">Sign in</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sign in to access your organizer dashboard and manage tournaments.
        </p>
      </div>
      {queryError && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">
          {decodeURIComponent(queryError)}
        </div>
      )}
      <LoginForm />
      <p className="text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-300">
          ← Back to homepage
        </Link>
      </p>
    </div>
  );
}
