import Link from "next/link";
import { getTournamentTeams } from "@/src/features/tournaments/organizer/queries/get-tournament-teams";
import { TournamentTeamsSection } from "@/src/features/tournaments/organizer/components/tournament-teams-section";

interface OrganizerTournamentTeamsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerTournamentTeamsPage({
  params,
}: OrganizerTournamentTeamsPageProps) {
  const { id } = await params;
  const data = await getTournamentTeams(id);

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

  return <TournamentTeamsSection data={data} />;
}
