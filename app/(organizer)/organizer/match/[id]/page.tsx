interface OrganizerMatchControlPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerMatchControlPage({
  params,
}: OrganizerMatchControlPageProps) {
  const { id } = await params;
  const { getPublicMatchDetail } = await import(
    "@/src/features/matches/public/queries/get-public-match-detail"
  );
  const { getPublicMatchEvents } = await import(
    "@/src/features/matches/public/queries/get-public-match-events"
  );
  const { getTeamRoster } = await import(
    "@/src/features/teams/organizer/queries/get-team-roster"
  );
  const { deriveMatchLineups } = await import(
    "@/src/features/matches/public/lib/derive-match-lineups"
  );

  const match = await getPublicMatchDetail({ matchId: id });
  if (!match) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
          <h2 className="text-2xl font-semibold text-slate-50">Match not found</h2>
          <p className="mt-2 text-sm text-slate-400">
            The match may have been removed or the ID is incorrect.
          </p>
        </div>
      </div>
    );
  }

  const events = await getPublicMatchEvents({ matchId: id });

  const homeRoster = match.home?.teamId ? await getTeamRoster(match.home.teamId) : null;
  const awayRoster = match.away?.teamId ? await getTeamRoster(match.away.teamId) : null;

  const lineups = deriveMatchLineups({ match, events });

  const { OrganizerMatchControlClient } = await import(
    "@/src/features/matches/organizer/components/organizer-match-control-client"
  );

  return (
    <OrganizerMatchControlClient
      match={match}
      events={events}
      homeRoster={homeRoster}
      awayRoster={awayRoster}
      derivedLineups={lineups}
    />
  );
}

