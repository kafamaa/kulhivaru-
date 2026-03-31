"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/src/lib/supabase/client";
import { assignDefaultRoleAction } from "@/src/features/auth/actions/assign-default-role";
import { getSessionRoleAction } from "@/src/features/auth/actions/get-session-role";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"exchanging" | "error">("exchanging");

  useEffect(() => {
    const code = searchParams.get("code");
    const nextParam = searchParams.get("next");

    if (!code) {
      router.replace("/auth/login?error=missing_code");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    supabase.auth
      .exchangeCodeForSession(code)
      .then(async ({ error }) => {
        if (error) {
          setStatus("error");
          router.replace(
            `/auth/login?error=${encodeURIComponent(error.message)}`
          );
          return;
        }
        await assignDefaultRoleAction();
        router.refresh();
        const { redirectTo } = await getSessionRoleAction();
        router.replace(nextParam ?? redirectTo);
      })
      .catch(() => {
        setStatus("error");
        router.replace("/auth/login?error=exchange_failed");
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950">
      <p className="text-sm text-slate-400">
        {status === "exchanging"
          ? "Completing sign in…"
          : "Something went wrong. Redirecting to sign in."}
      </p>
    </div>
  );
}
