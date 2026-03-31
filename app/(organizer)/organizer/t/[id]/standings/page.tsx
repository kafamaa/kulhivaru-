import Link from "next/link";
import { getTournamentStandingsAdmin } from "@/src/features/standings/organizer/queries/get-tournament-standings-admin";
import { StandingsAdminSection } from "@/src/features/standings/organizer/components/standings-admin-section";

interface OrganizerTournamentStandingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerTournamentStandingsPage({
  params,
}: OrganizerTournamentStandingsPageProps) {
  const { id } = await params;
  const data = await getTournamentStandingsAdmin(id);

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

  return <StandingsAdminSection data={data} />;
}

