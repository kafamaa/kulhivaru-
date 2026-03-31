import Link from "next/link";
import { getTournamentMatches } from "@/src/features/matches/organizer/queries/get-tournament-matches";
import { TournamentMatchesSection } from "@/src/features/matches/organizer/components/tournament-matches-section";

interface OrganizerTournamentMatchesPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerTournamentMatchesPage({
  params,
}: OrganizerTournamentMatchesPageProps) {
  const { id } = await params;
  const data = await getTournamentMatches(id);

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

  return <TournamentMatchesSection data={data} />;
}

