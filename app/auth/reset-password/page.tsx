"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/client";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const next = searchParams.get("next") ?? "/auth/login";

  const hasTokens = Boolean(accessToken && refreshToken);

  const [status, setStatus] = useState<"idle" | "saving" | "error" | "done">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const helper = useMemo(() => {
    if (!hasTokens) {
      return "This link is missing reset credentials. Use “Forgot password” to get a new email.";
    }
    return "Choose a new password. After saving, you’ll be redirected to sign in.";
  }, [hasTokens]);

  useEffect(() => {
    if (status !== "idle") return;
    if (hasTokens) return;
    // Keep the UI visible; no auto-redirect to avoid breaking UX.
  }, [hasTokens, status]);

  const onSubmit = async (values: ResetPasswordInput) => {
    setError(null);
    setStatus("saving");

    try {
      if (!accessToken || !refreshToken) {
        setStatus("error");
        setError("Reset link is missing tokens. Request a new reset email.");
        return;
      }

      const supabase = getSupabaseBrowserClient();

      // Restore the session from the reset link credentials.
      const { error: setSessionErr } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (setSessionErr) {
        setStatus("error");
        setError(setSessionErr.message);
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (updateErr) {
        setStatus("error");
        setError(updateErr.message);
        return;
      }

      setStatus("done");
      router.push(`${next}?reset=success`);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to reset password.");
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-50">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-slate-400">{helper}</p>
      </div>

      {status === "done" ? (
        <div className="rounded-xl border border-emerald-800 bg-emerald-950/50 p-6 text-center text-sm text-emerald-200">
          Password updated. Redirecting…
        </div>
      ) : (
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
              htmlFor="reset-password"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              New password
            </label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
              disabled={!hasTokens || status === "saving"}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 disabled:opacity-60 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="reset-confirm"
              className="mb-1 block text-sm font-medium text-slate-200"
            >
              Confirm password
            </label>
            <input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
              disabled={!hasTokens || status === "saving"}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 disabled:opacity-60 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {form.formState.errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!hasTokens || status === "saving"}
            className="w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {status === "saving" ? "Saving…" : "Save new password"}
          </button>

          {!hasTokens ? (
            <p className="text-center text-xs text-slate-500">
              Need a new link?{" "}
              <Link href="/auth/forgot-password" className="hover:text-slate-300">
                Request reset
              </Link>
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}

