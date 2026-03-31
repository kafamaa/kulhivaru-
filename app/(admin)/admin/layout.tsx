import type { ReactNode } from "react";

import { getSessionUser } from "@/src/lib/auth/session";
import { isAdmin } from "@/src/lib/permissions";
import { AccessDenied } from "@/src/components/shared/access-denied";
import { AdminShell } from "@/src/features/admin/components/admin-shell";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export const metadata = {
  title: "Super admin · Kulhivaru+",
  description:
    "Platform control: organizations, tournaments, users, operations, analytics, audit, and system tools",
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user)) {
    return (
      <AccessDenied
        title="Admin access required"
        message="You need super admin (platform admin) rights to view this area."
        signInHref="/"
      />
    );
  }

  let displayName: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    const dn = (data as { display_name?: string | null })?.display_name;
    displayName = dn && String(dn).trim() ? String(dn).trim() : null;
  } catch {
    displayName = null;
  }

  return (
    <AdminShell userEmail={user.email} displayName={displayName}>
      {children}
    </AdminShell>
  );
}
