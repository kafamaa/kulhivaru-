"use server";

import { getSessionUser } from "@/src/lib/auth/session";

/**
 * Returns the current user's role for client-side redirect after login.
 * Call after signInWithPassword or when session is already set.
 */
export async function getSessionRoleAction(): Promise<{
  role: string | null;
  redirectTo: string;
}> {
  const user = await getSessionUser();
  if (!user) {
    return { role: null, redirectTo: "/" };
  }

  if (user.role === "super_admin") {
    return { role: user.role, redirectTo: "/superadmin" };
  }

  if (user.role === "admin" || user.role === "organizer") {
    return { role: user.role, redirectTo: "/organizer" };
  }

  return { role: user.role, redirectTo: "/" };
}
