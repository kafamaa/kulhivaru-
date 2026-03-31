import Link from "next/link";
import { getOrganizerDashboardData } from "@/src/features/organizer/queries/get-dashboard-data";
import { TournamentCard } from "@/src/features/organizer/components/tournament-card";

export default async function OrganizerTournamentsPage() {
  const data = await getOrganizerDashboardData();
  const { tournaments } = data;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Tournaments</h1>
          <p className="mt-1 text-sm text-slate-400">
            Your competitions across organizations, seasons and sports.
          </p>
        </div>
        <Link
          href="/organizer/tournaments/new"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
        >
          ➕ Create Tournament
        </Link>
      </header>

      {tournaments.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center">
          <p className="text-slate-400">No tournaments yet.</p>
          <Link
            href="/organizer/tournaments/new"
            className="mt-4 inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Create your first tournament
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
}
