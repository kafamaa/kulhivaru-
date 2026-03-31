import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { SessionUser } from "./types";

function isBenignAuthCrowdingError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("request rate limit") ||
    m.includes("over_request_rate_limit") ||
    m.includes("too many concurrent") ||
    m.includes("concurrent token refresh")
  );
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();

  let authUser: {
    id: string;
    email?: string | null;
    app_metadata?: Record<string, unknown> | null;
  } | null = null;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isBenignAuthCrowdingError(error.message)) return null;
      return null;
    }
    const u = data.user;
    if (!u?.id) {
      authUser = null;
    } else {
      authUser = {
        id: u.id,
        email: u.email,
        app_metadata: u.app_metadata ?? null,
      };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (isBenignAuthCrowdingError(msg)) return null;
    return null;
  }

  if (!authUser) return null;

  let profile: { role?: SessionUser["role"] } | null = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .single();
    profile = data as typeof profile;
  } catch {
    profile = null;
  }

  const profileRole = profile?.role as SessionUser["role"] | undefined;
  const appRole = authUser.app_metadata?.role as SessionUser["role"] | undefined;

  const isValidRole = (r: unknown): r is SessionUser["role"] =>
    typeof r === "string" &&
    ["member", "organizer", "admin", "super_admin"].includes(r as SessionUser["role"]);

  const role: SessionUser["role"] = (() => {
    if (isValidRole(appRole) && appRole !== "member") {
      if (!isValidRole(profileRole)) return appRole;
      return profileRole === "member" ? appRole : profileRole;
    }

    if (isValidRole(profileRole)) return profileRole;
    if (isValidRole(appRole)) return appRole;
    return "member";
  })();

  return {
    id: authUser.id,
    email: authUser.email ?? null,
    role,
  };
}
