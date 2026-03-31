"use server";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { DEFAULT_ROLE } from "@/src/constants/roles";
import type { PlatformRole } from "@/src/lib/auth/types";

/**
 * Assigns a role to the current user in app_metadata if they don't have one.
 * Uses service role so only call from trusted server code after auth.
 * Safe to call after sign-up or email confirmation.
 */
export async function assignDefaultRoleAction(): Promise<{
  success: boolean;
  role?: PlatformRole;
  error?: string;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const existingRole = user.app_metadata?.role as PlatformRole | undefined;
    if (
      existingRole &&
      ["member", "organizer", "admin", "super_admin"].includes(existingRole)
    ) {
      return { success: true, role: existingRole };
    }

    // Use desired role from user_metadata (set at sign-up) or default
    const desiredRole =
      (user.user_metadata?.desired_role as PlatformRole) ?? DEFAULT_ROLE;
    const role: PlatformRole =
      desiredRole === "organizer" || desiredRole === "admin"
        ? desiredRole
        : DEFAULT_ROLE;

    // Always update public.profiles so role is correct (trigger may have created row on signup)
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, role, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    const admin = createSupabaseAdminClient();
    if (admin) {
      const { error: updateError } = await admin.auth.admin.updateUserById(
        user.id,
        { app_metadata: { role } }
      );
      if (updateError) {
        return { success: false, error: updateError.message };
      }
    }

    return { success: true, role };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { success: false, error: message };
  }
}
