import Link from "next/link";
import { getTeamRoster } from "@/src/features/teams/organizer/queries/get-team-roster";
import { TeamRosterSection } from "@/src/features/teams/organizer/components/team-roster-section";

interface OrganizerTeamRosterPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerTeamRosterPage({
  params,
}: OrganizerTeamRosterPageProps) {
  const { id } = await params;
  const data = await getTeamRoster(id);

  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">Team not found.</p>
        <Link
          href="/organizer"
          className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          ← Back to organizer dashboard
        </Link>
      </div>
    );
  }

  return <TeamRosterSection data={data} />;
}

