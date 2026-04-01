import Link from "next/link";
import { getTournamentAwardsData } from "@/src/features/tournaments/organizer/queries/get-tournament-awards-data";
import { TournamentAwardsSection } from "@/src/features/tournaments/organizer/components/tournament-awards-section";

interface OrganizerTournamentAwardsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerTournamentAwardsPage({
  params,
}: OrganizerTournamentAwardsPageProps) {
  const { id } = await params;
  const data = await getTournamentAwardsData(id);

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

  return <TournamentAwardsSection data={data} />;
}
