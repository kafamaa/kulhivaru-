import { getOrganizerTournamentMediaSnapshot } from "@/src/features/media/organizer/queries/get-organizer-tournament-media-snapshot";
import { OrganizerMediaTabs } from "@/src/features/media/organizer/components/organizer-media-tabs";

interface OrganizerTournamentMediaPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerTournamentMediaPage({
  params,
}: OrganizerTournamentMediaPageProps) {
  const { id } = await params;

  const snapshot = await getOrganizerTournamentMediaSnapshot(id);

  if (!snapshot) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center">
        <p className="text-sm text-slate-300">Tournament not found.</p>
      </div>
    );
  }

  return <OrganizerMediaTabs snapshot={snapshot} />;
}
