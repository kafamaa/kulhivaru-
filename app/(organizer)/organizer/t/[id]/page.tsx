import Link from "next/link";
import { StatCard } from "@/src/features/organizer/components/stat-card";
import { AlertBanner } from "@/src/features/organizer/components/alert-banner";
import { MatchCard } from "@/src/features/organizer/components/match-card";
import { getTournamentOverview } from "@/src/features/tournaments/organizer/queries/get-tournament-overview";

interface OrganizerTournamentOverviewPageProps {
  params: Promise<{ id: string }>;
}

function statusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "ongoing":
      return {
        label: "Ongoing",
        className:
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      };
    case "upcoming":
      return {
        label: "Upcoming",
        className: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      };
    case "completed":
      return {
        label: "Completed",
        className: "border-slate-600 bg-slate-800/60 text-slate-300",
      };
    case "archived":
      return {
        label: "Archived",
        className: "border-slate-700 bg-slate-900 text-slate-400",
      };
    default:
      return {
        label: "Draft",
        className: "border-slate-600 bg-slate-900/70 text-slate-300",
      };
  }
}

export default async function OrganizerTournamentOverviewPage({
  params,
}: OrganizerTournamentOverviewPageProps) {
  const { id } = await params;
  const data = await getTournamentOverview(id);

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

  const badge = statusBadge(data.stats.status);
  const hasTeams = data.stats.teamApproved >= 2;
  const hasMatches = data.stats.matchesTotal > 0;
  const noSchedulingGaps = data.stats.matchesUnscheduled === 0;
  const noPending = data.stats.teamPending === 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold text-slate-50">
              {data.tournamentName}
            </h1>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            Operational snapshot, issues to resolve, and quick actions.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {data.stats.location ? `${data.stats.location} · ` : ""}
            {data.stats.startDate ?? "—"} → {data.stats.endDate ?? "—"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/t/${data.tournamentSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            View public
          </Link>
          <Link
            href={`/organizer/t/${data.tournamentId}/teams`}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Teams
          </Link>
          <Link
            href={`/organizer/t/${data.tournamentId}/matches`}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Matches
          </Link>
          <Link
            href={`/organizer/t/${data.tournamentId}/standings`}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Standings
          </Link>
          <Link
            href={`/organizer/t/${data.tournamentId}/settings`}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Settings
          </Link>
        </div>
      </header>

      {/* Overview stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Teams approved"
          value={data.stats.teamApproved}
          href={`/organizer/t/${data.tournamentId}/teams`}
        />
        <StatCard
          label="Pending approvals"
          value={data.stats.teamPending}
          href={`/organizer/t/${data.tournamentId}/teams`}
        />
        <StatCard
          label="Matches today"
          value={data.stats.matchesToday}
          href={`/organizer/t/${data.tournamentId}/matches`}
        />
        <StatCard
          label="Needs attention"
          value={data.stats.matchesUnscheduled + data.stats.matchesMissingResults}
          href={`/organizer/t/${data.tournamentId}/matches`}
        />
      </section>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Action required
          </h2>
          <div className="flex flex-col gap-2">
            {data.alerts.map((a) => (
              <AlertBanner key={a.id} alert={a} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming matches */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Upcoming matches
            </h2>
            <Link
              href={`/organizer/t/${data.tournamentId}/matches`}
              className="text-sm font-medium text-slate-400 hover:text-slate-200"
            >
              Open matches →
            </Link>
          </div>
          {data.upcomingMatches.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center">
              <p className="text-slate-400">No upcoming matches scheduled.</p>
              <p className="mt-1 text-xs text-slate-500">
                Add kick-off times in Matches to see them here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.upcomingMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>

        {/* Operational checklist */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Setup checklist
          </h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="text-slate-300">Have at least 2 approved teams</span>
                <span className={hasTeams ? "text-emerald-400" : "text-slate-500"}>
                  {hasTeams ? "✓" : "—"}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-slate-300">Matches created</span>
                <span className={hasMatches ? "text-emerald-400" : "text-slate-500"}>
                  {hasMatches ? "✓" : "—"}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-slate-300">No unscheduled matches</span>
                <span
                  className={noSchedulingGaps ? "text-emerald-400" : "text-amber-400"}
                >
                  {noSchedulingGaps ? "✓" : `${data.stats.matchesUnscheduled}`}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-slate-300">No pending approvals</span>
                <span className={noPending ? "text-emerald-400" : "text-amber-400"}>
                  {noPending ? "✓" : `${data.stats.teamPending}`}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-slate-300">Results up to date</span>
                <span
                  className={
                    data.stats.matchesMissingResults === 0
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }
                >
                  {data.stats.matchesMissingResults === 0
                    ? "✓"
                    : `${data.stats.matchesMissingResults}`}
                </span>
              </li>
            </ul>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/organizer/t/${data.tournamentId}/teams`}
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
              >
                Approve teams
              </Link>
              <Link
                href={`/organizer/t/${data.tournamentId}/matches`}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Schedule matches
              </Link>
              {data.upcomingMatches[0]?.id ? (
                <Link
                  href={`/organizer/match/${data.upcomingMatches[0].id}`}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  Enter result
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {/* Recent activity (placeholder data derived from match created_at) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Recent activity
        </h2>
        {data.recentlyUpdated.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 text-sm text-slate-400">
            No recent updates yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.recentlyUpdated.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

