import Link from "next/link";
import { getTournamentSettings } from "@/src/features/tournaments/organizer/queries/get-tournament-settings";
import { TournamentSettingsSection } from "@/src/features/tournaments/organizer/components/tournament-settings-section";

interface OrganizerTournamentSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerTournamentSettingsPage({
  params,
}: OrganizerTournamentSettingsPageProps) {
  const { id } = await params;
  const data = await getTournamentSettings(id);

  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">Tournament not found.</p>
        <Link
          href="/organizer/tournaments"
          className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          ← Back to tournaments
        </Link>
      </div>
    );
  }

  return <TournamentSettingsSection data={data} />;
}

