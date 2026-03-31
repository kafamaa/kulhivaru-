"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/client";
import { getSessionRoleAction } from "../actions/get-session-role";
import { loginSchema, type LoginInput } from "../schemas/login";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    router.refresh();
    const { redirectTo } = await getSessionRoleAction();
    router.push(redirectTo);
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-6"
    >
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="login-email"
          className="mb-1 block text-sm font-medium text-slate-200"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          {...form.register("email")}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="you@example.com"
        />
        {form.formState.errors.email && (
          <p className="mt-1 text-xs text-red-400">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="mb-1 block text-sm font-medium text-slate-200"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          {...form.register("password")}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="••••••••"
        />
        {form.formState.errors.password && (
          <p className="mt-1 text-xs text-red-400">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </button>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href="/auth/forgot-password" className="text-slate-400 hover:text-slate-200">
            Forgot password?
          </Link>
          <Link href="/auth/signup" className="text-slate-400 hover:text-slate-200">
            Don’t have an account? Sign up
          </Link>
        </div>
      </div>
    </form>
  );
}
