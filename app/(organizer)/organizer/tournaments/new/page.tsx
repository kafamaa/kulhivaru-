import { TournamentWizardShell } from "@/src/features/tournaments/wizard/components/tournament-wizard-shell";
import { NewTournamentFlow } from "@/src/features/tournaments/create/components/new-tournament-flow";
import { ensureMyOrganization } from "@/src/features/organizer/queries/ensure-my-organization";
import { getOrganizerOrganizations } from "@/src/features/organizer/queries/get-organizations";
import { getSessionUser } from "@/src/lib/auth/session";
import { canAccessOrganizerDashboard } from "@/src/lib/permissions";
import { AccessDenied } from "@/src/components/shared/access-denied";

interface NewTournamentPageProps {
  searchParams: Promise<{ org?: string; step?: string; setup?: string }>;
}

export default async function NewTournamentPage({
  searchParams,
}: NewTournamentPageProps) {
  const user = await getSessionUser();
  if (!user) {
    return (
      <AccessDenied
        title="Organizer access required"
        message="Sign in with an organizer account to create tournaments."
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
        message="Sign in with an organizer account to create tournaments."
        signInHref="/"
      />
    );
  }

  const params = await searchParams;
  // Option A: always ensure and use the user's single organization
  const org =
    hasRoleAccess && organizations.length === 0
      ? await ensureMyOrganization()
      : organizations[0] ?? (await ensureMyOrganization());
  const organizationId = params.org ?? org?.id ?? null;
  const setupMode = (params.setup ?? "").toLowerCase();

  const requestedStep = (params.step ?? "").toLowerCase();
  const allowedSteps = new Set(["basics", "categories", "registration", "format", "review"]);
  const isWizardStepRequest = requestedStep.length > 0 && allowedSteps.has(requestedStep);

  // Quick Tournament screen by default.
  // If the user directly requests a wizard step (e.g. ?step=basics), open the wizard.
  // Keep setup=advanced for backward compatibility.
  if (setupMode !== "advanced" && !isWizardStepRequest) {
    return <NewTournamentFlow organizationId={organizationId} />;
  }

  return (
    <TournamentWizardShell
      organizationId={organizationId}
      organizationName={org?.name ?? null}
      initialDraft={null}
      initialStep={((isWizardStepRequest ? requestedStep : params.step) as any) ?? null}
    />
  );
}
