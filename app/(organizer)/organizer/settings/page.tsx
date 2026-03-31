import Link from "next/link";
import { ensureMyOrganization } from "@/src/features/organizer/queries/ensure-my-organization";
import { getOrganizerOrganizations } from "@/src/features/organizer/queries/get-organizations";
import { OrganizationSettingsSection } from "@/src/features/organizer/components/organization-settings-section";

export default async function OrganizerSettingsPage() {
  const organizations = await getOrganizerOrganizations();
  const org =
    organizations[0] ??
    // Fallback: if no org row is visible yet, try bootstrapping via RPC.
    (await ensureMyOrganization());

  if (!org) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-50">
          Organization settings
        </h1>
        <p className="text-sm text-slate-400">
          Could not load your organization.
        </p>
        <Link
          href="/organizer"
          className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return <OrganizationSettingsSection organization={org} />;
}

