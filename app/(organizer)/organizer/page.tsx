import Link from "next/link";
import { getOrganizerDashboardData } from "@/src/features/organizer/queries/get-dashboard-data";
import { StatCard } from "@/src/features/organizer/components/stat-card";
import { TournamentCard } from "@/src/features/organizer/components/tournament-card";
import { MatchCard } from "@/src/features/organizer/components/match-card";
import { AlertBanner } from "@/src/features/organizer/components/alert-banner";
import { QuickActionButton } from "@/src/features/organizer/components/quick-action-button";

export default async function OrganizerDashboardPage() {
  const data = await getOrganizerDashboardData();
  const { stats, tournaments, alerts, upcomingMatches } = data;
  const hasTournaments = tournaments.length > 0;
  const hasUpcomingMatches = upcomingMatches.length > 0;
  const hasPending = stats.pendingRegistrations > 0;
  const needsFirstTournament = tournaments.length === 0;
  const needsTeams = hasTournaments && stats.totalTeams === 0;
  const needsFixtures = hasTournaments && upcomingMatches.length === 0;
  const nextStepHref = needsFirstTournament
    ? "/organizer/tournaments/new"
    : "/organizer/tournaments";
  const nextStepCta = needsFirstTournament
    ? "Create tournament"
    : needsTeams
      ? "Add teams"
      : "Create fixtures";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-50">Welcome back</h2>
            <p className="text-sm text-slate-400">
              Manage tournaments, teams, fixtures, and results from one place.
            </p>
        </div>

        {(needsFirstTournament || needsTeams || needsFixtures) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-800/70 bg-amber-950/20 p-3 text-sm text-amber-100">
            <div>
            <p className="font-medium">Suggested next step</p>
            <p className="mt-1 text-amber-200/90">
              {needsFirstTournament
                ? "Create your first tournament to get started."
                : needsTeams
                  ? "Add or approve teams so you can generate fixtures."
                  : "Generate and schedule fixtures so upcoming matches appear here."}
            </p>
            </div>
            <Link
              href={nextStepHref}
              className="rounded-lg bg-amber-400/90 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-amber-300"
            >
              {nextStepCta}
            </Link>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          At a glance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active tournaments"
            value={stats.activeTournaments}
            href="/organizer/tournaments"
          />
          <StatCard
            label="Total teams"
            value={stats.totalTeams}
            href="/organizer/tournaments"
          />
          <StatCard
            label="Matches today"
            value={stats.matchesToday}
            href="/organizer/tournaments"
          />
          <StatCard
            label="Pending registrations"
            value={stats.pendingRegistrations}
            href="/organizer/tournaments"
          />
        </div>
      </section>

      {/* Alerts / Action required */}
      {(alerts.length > 0 || hasPending) && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Needs attention
          </h2>
          <div className="flex flex-col gap-2">
            {alerts.map((alert) => (
              <AlertBanner key={alert.id} alert={alert} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Active tournaments */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Your tournaments
            </h2>
            <Link
              href="/organizer/tournaments/new"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              + New tournament
            </Link>
          </div>
          {!hasTournaments ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center">
              <p className="text-slate-300">No tournaments yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Start with a quick tournament and fill details later.
              </p>
              <Link
                href="/organizer/tournaments/new"
                className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Create your first tournament
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tournaments.slice(0, 6).map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
              {tournaments.length > 6 && (
                <Link
                  href="/organizer/tournaments"
                  className="rounded-lg border border-slate-700 py-2 text-center text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  View all ({tournaments.length})
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Upcoming matches */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Upcoming fixtures
            </h2>
            <Link
              href="/organizer/tournaments"
              className="text-sm font-medium text-slate-400 hover:text-slate-200"
            >
              View tournaments
            </Link>
          </div>
          {!hasUpcomingMatches ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center">
              <p className="text-slate-300">No fixtures yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Generate fixtures from a tournament and schedule match dates.
              </p>
              <Link
                href="/organizer/tournaments"
                className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Go to tournaments
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingMatches.slice(0, 5).map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <QuickActionButton
            href="/organizer/tournaments/new"
            label="Create Tournament"
          />
          <QuickActionButton
            href="/organizer/tournaments"
            label="Add teams"
          />
          <QuickActionButton
            href="/organizer/tournaments"
            label="Create fixtures"
          />
          <QuickActionButton
            href="/organizer/tournaments"
            label="Enter results"
          />
          <QuickActionButton
            href="/organizer/settings"
            label="Organization settings"
          />
        </div>
      </section>
    </div>
  );
}
