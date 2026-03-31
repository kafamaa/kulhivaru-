import type { ReactNode } from "react";

import { OrganizerTournamentScope } from "@/src/features/organizer/components/layout/organizer-workspace-context";
import { getOrganizerTournamentNavForMatch } from "@/src/features/organizer/queries/get-organizer-tournament-nav";

export default async function OrganizerMatchSectionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nav = await getOrganizerTournamentNavForMatch(id);

  if (!nav) {
    return children;
  }

  return (
    <OrganizerTournamentScope tournamentId={nav.tournamentId} tournamentName={nav.name}>
      {children}
    </OrganizerTournamentScope>
  );
}
