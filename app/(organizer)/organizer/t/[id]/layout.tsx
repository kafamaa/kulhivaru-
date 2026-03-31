import type { ReactNode } from "react";

import { OrganizerTournamentScope } from "@/src/features/organizer/components/layout/organizer-workspace-context";
import { getOrganizerTournamentNavById } from "@/src/features/organizer/queries/get-organizer-tournament-nav";

export default async function OrganizerTournamentSectionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nav = await getOrganizerTournamentNavById(id);
  const label = nav?.name ?? "Tournament";

  return (
    <OrganizerTournamentScope tournamentId={id} tournamentName={label}>
      {children}
    </OrganizerTournamentScope>
  );
}
