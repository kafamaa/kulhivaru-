"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        // The reset password page will receive `access_token` / `refresh_token` in the URL.
        redirectTo: `${window.location.origin}/auth/reset-password?next=/auth/login`,
      }
    );
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-sm space-y-6 px-4 py-12">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">Reset password</h1>
        <p className="mt-1 text-sm text-slate-400">
          Enter your email and we’ll send you a link to reset your password.
        </p>
      </div>

      {sent ? (
        <div className="rounded-xl border border-emerald-800 bg-emerald-950/50 p-6 text-center text-sm text-emerald-200">
          Check your inbox. If an account exists for that email, we’ve sent a
          password reset link.
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-6"
        >
          {error && (
            <div className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="forgot-email"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-slate-400">
        <Link href="/auth/login" className="hover:text-slate-200">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
