import type { ReactNode } from "react";
import { getSessionUser } from "@/src/lib/auth/session";
import { canAccessOrganizerDashboard } from "@/src/lib/permissions";
import { AccessDenied } from "@/src/components/shared/access-denied";
import { DashboardLayout } from "@/src/features/organizer/components/layout/dashboard-layout";
import { getOrganizerOrganizations } from "@/src/features/organizer/queries/get-organizations";
import { ensureMyOrganization } from "@/src/features/organizer/queries/ensure-my-organization";

export default async function OrganizerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    return (
      <AccessDenied
        title="Organizer access required"
        message="Sign in with an organizer account to manage tournaments."
        signInHref="/"
      />
    );
  }

  const organizations = await getOrganizerOrganizations();
  const hasRoleAccess = canAccessOrganizerDashboard(user);
  const hasOrgOwnership = organizations.length > 0;

  if (!hasRoleAccess && !hasOrgOwnership) {
    return (
      <AccessDenied
        title="Organizer access required"
        message="Sign in with an organizer account to manage tournaments."
        signInHref="/"
      />
    );
  }

  // If role access is present but org ownership row isn't created yet,
  // attempt to create it (best effort).
  if (hasRoleAccess && organizations.length === 0) {
    try {
      await ensureMyOrganization();
    } catch {
      // If ensure_my_organization fails due to stale profile role,
      // the user may still get access if they already own an org row.
    }
  }

  const organizationsAfterEnsure =
    hasRoleAccess && organizations.length === 0
      ? await getOrganizerOrganizations()
      : organizations;

  return (
    <DashboardLayout organizations={organizationsAfterEnsure}>
      {children}
    </DashboardLayout>
  );
}
