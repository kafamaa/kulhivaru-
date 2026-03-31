import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/src/lib/auth/session";
import { isSuperAdmin } from "@/src/lib/permissions";
import { SuperAdminShell } from "@/src/features/superadmin/components/superadmin-shell";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export const metadata = {
  title: "Super Admin · Kulhivaru+",
  description: "Platform governance and mission control",
};

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/?signin=1");
  }
  if (!isSuperAdmin(user)) {
    redirect("/unauthorized?from=superadmin");
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
    <SuperAdminShell userEmail={user.email} displayName={displayName}>
      {children}
    </SuperAdminShell>
  );
}
