"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/client";
import { assignDefaultRoleAction } from "../actions/assign-default-role";
import { getSessionRoleAction } from "../actions/get-session-role";
import { signupSchema, type SignupInput } from "../schemas/signup";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: "member",
    },
  });

  const onSubmit = async (values: SignupInput) => {
    setError(null);
    setSuccessMessage(null);
    const supabase = getSupabaseBrowserClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          desired_role: values.role,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data?.user && !data.user.confirmed_at) {
      setSuccessMessage(
        "Check your email to confirm your account, then sign in."
      );
      form.reset();
      return;
    }

    await assignDefaultRoleAction();
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
      {successMessage && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-200">
          {successMessage}
        </div>
      )}

      <div>
        <label
          htmlFor="signup-email"
          className="mb-1 block text-sm font-medium text-slate-200"
        >
          Email
        </label>
        <input
          id="signup-email"
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
          htmlFor="signup-password"
          className="mb-1 block text-sm font-medium text-slate-200"
        >
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          {...form.register("password")}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="At least 8 characters"
        />
        {form.formState.errors.password && (
          <p className="mt-1 text-xs text-red-400">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="signup-confirm"
          className="mb-1 block text-sm font-medium text-slate-200"
        >
          Confirm password
        </label>
        <input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          {...form.register("confirmPassword")}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="••••••••"
        />
        {form.formState.errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-400">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-200">
          Sign up as
        </legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10">
            <input
              type="radio"
              value="member"
              {...form.register("role")}
              className="mt-0.5 h-4 w-4 shrink-0 border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            <div>
              <span className="block text-sm font-medium text-slate-200">Member</span>
              <span className="text-xs text-slate-500">Browse and follow tournaments</span>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10">
            <input
              type="radio"
              value="organizer"
              {...form.register("role")}
              className="mt-0.5 h-4 w-4 shrink-0 border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            <div>
              <span className="block text-sm font-medium text-slate-200">Organizer</span>
              <span className="text-xs text-slate-500">Create and manage tournaments</span>
            </div>
          </label>
        </div>
        {form.formState.errors.role && (
          <p className="mt-1 text-xs text-red-400">
            {form.formState.errors.role.message}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {form.formState.isSubmitting ? "Creating account…" : "Create account"}
        </button>
        <Link
          href="/auth/login"
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </form>
  );
}
