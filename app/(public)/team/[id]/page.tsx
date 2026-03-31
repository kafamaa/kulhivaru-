import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getPublicTeamProfile } from "@/src/features/teams/queries/get-public-team-profile";
import { getPublicTeamTournaments } from "@/src/features/teams/queries/get-public-team-tournaments";
import { getPublicTeamMatches } from "@/src/features/teams/queries/get-public-team-matches";
import { getPublicTeamPerformance } from "@/src/features/teams/queries/get-public-team-performance";
import { getPublicTeamStandingsSnapshot } from "@/src/features/teams/queries/get-public-team-standings-snapshot";
import { getPublicTeamTopScorer } from "@/src/features/teams/queries/get-public-team-top-scorer";
import type { PublicTeamMatch } from "@/src/features/teams/queries/get-public-team-matches";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

function statusBadgeClass(status: string) {
  if (status === "active") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (status === "qualified") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (status === "pending") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  if (status === "eliminated") return "border-slate-700 bg-slate-900 text-slate-300";
  return "border-slate-700 bg-slate-900 text-slate-400";
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  const [team, tournaments, matches, performance] = await Promise.all([
    getPublicTeamProfile(id),
    getPublicTeamTournaments({ teamId: id }),
    getPublicTeamMatches({ teamId: id }),
    getPublicTeamPerformance({ teamId: id }),
  ]);

  if (!team) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">Team not found.</p>
      </div>
    );
  }

  const tournamentIds = Array.from(
    new Set((tournaments ?? []).map((t) => t.tournamentId))
  );

  const [standingsSnapshots, topScorer] = await Promise.all([
    getPublicTeamStandingsSnapshot({
      teamId: id,
      tournamentIds,
    }),
    getPublicTeamTopScorer({ teamId: id }),
  ]);

  const primaryTournament = tournaments[0] ?? null;
  const primaryStandingsRank =
    primaryTournament == null
      ? null
      : standingsSnapshots.find(
          (s) => s.tournamentId === primaryTournament.tournamentId
        )?.rank ?? null;
  const approvedCount = tournaments.filter((t) => t.entryStatus === "approved").length;
  const pendingCount = tournaments.filter((t) => t.entryStatus === "pending").length;
  const rejectedCount = tournaments.filter((t) => t.entryStatus === "rejected").length;

  const teamHubStatus: "active" | "qualified" | "pending" | "eliminated" =
    approvedCount > 0
      ? (tournaments.some((t) => t.tournamentStatus === "ongoing") ? "active" : "qualified")
      : pendingCount > 0
        ? "pending"
        : rejectedCount > 0
          ? "eliminated"
          : "pending";

  const matchesPlayed = performance.matchesPlayed;
  const gdTotal = performance.goalsFor - performance.goalsAgainst;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {team.logoUrl ? (
              <Image
                src={team.logoUrl}
                alt={team.teamName}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full border border-slate-800 bg-slate-900 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-lg font-semibold text-slate-200">
                {team.teamName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-50">
                {team.teamName}
              </h1>
              <p className="mt-1 text-xs text-slate-500 font-mono">
                Team ID: {team.teamId}
              </p>
            </div>
            <span
              className={`ml-2 hidden rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex ${statusBadgeClass(
                teamHubStatus
              )}`}
            >
              {teamHubStatus}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {primaryTournament ? (
              <>
                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-slate-300">
                  {primaryTournament.tournamentName}
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-slate-300">
                  {primaryTournament.categoryDivision}
                </span>
              </>
            ) : (
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-slate-300">
                No tournament participation yet
              </span>
            )}
          </div>

          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            This is the team’s home inside the tournament ecosystem. View
            roster, standings snapshot, and match schedule.
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-2 sm:justify-end">
          <Link
            href={`/organizer/team/${team.teamId}`}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Organizer roster
          </Link>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-8">
        <Stat label="MP" value={matchesPlayed} />
        <Stat label="W" value={performance.wins} />
        <Stat label="D" value={performance.draws} />
        <Stat label="L" value={performance.losses} />
        <Stat label="GF" value={performance.goalsFor} />
        <Stat label="GA" value={performance.goalsAgainst} />
        <Stat label="Pts" value={performance.points} />
        <Stat label="Pos" value={primaryStandingsRank ?? "—"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Standings snapshot
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Quick view from <span className="font-mono">standings_cache</span>.
              </p>
            </div>
            <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">
              GD: {gdTotal >= 0 ? `+${gdTotal}` : gdTotal}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {standingsSnapshots.length === 0 ? (
              <EmptyState text="No standings yet. Enter match results, then recompute standings cache." />
            ) : (
              standingsSnapshots.map((s) => (
                <div
                  key={s.tournamentId}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {s.tournamentName}
                        </p>
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300">
                          {s.groupName}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Rank #{s.rank} · Played {s.played}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Points</p>
                        <p className="text-lg font-bold text-emerald-300 tabular-nums">
                          {s.points}
                        </p>
                      </div>
                      <Link
                        href={`/t/${s.tournamentSlug}/standings`}
                        className="hidden rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 sm:inline-flex"
                      >
                        Full standings →
                      </Link>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs">
                      <p className="text-slate-500">Nearby teams</p>
                      <ul className="mt-2 space-y-1">
                        {s.nearbyTeams.length === 0 ? (
                          <li className="text-slate-400">No nearby rows.</li>
                        ) : (
                          s.nearbyTeams
                            .slice(0, 5)
                            .map((t) => (
                              <li
                                key={t.teamId}
                                className="flex items-center justify-between gap-3"
                              >
                                <span className="truncate text-slate-200">
                                  {t.rank}. {t.teamName}
                                </span>
                                <span className="tabular-nums text-slate-400">
                                  {t.points} pts
                                </span>
                              </li>
                            ))
                        )}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs sm:col-span-2">
                      <p className="text-slate-500">Goal difference</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100 tabular-nums">
                        {s.goalDifference >= 0 ? `+${s.goalDifference}` : s.goalDifference}
                      </p>
                      <p className="mt-1 text-slate-500">
                        This is computed from your finished matches.
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-100">Tournaments</h2>
          <p className="mt-1 text-xs text-slate-500">
            Where this team competes.
          </p>

          <div className="mt-4 space-y-3">
            {tournaments.length === 0 ? (
              <EmptyState text="No tournament participation yet." />
            ) : (
              tournaments.map((t) => (
                <div
                  key={t.tournamentId}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {t.tournamentName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t.categoryDivision} · {t.tournamentSport}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-300">
                      {t.entryStatus}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-slate-800 bg-slate-900/30 px-2 py-1">
                      Tournament: {t.tournamentStatus}
                    </span>
                    {t.standingsRank ? (
                      <span className="rounded-full border border-emerald-800/60 bg-emerald-950/20 px-2 py-1 text-emerald-200">
                        Rank #{t.standingsRank}
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-800 bg-slate-900/30 px-2 py-1">
                        Standings: —
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <Link
                      href={`/t/${t.tournamentSlug}/standings`}
                      className="inline-flex text-xs font-medium text-emerald-300 hover:text-emerald-200"
                    >
                      View standings →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Recent matches
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Last finished results (team perspective).
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {matches.recent.length === 0 ? (
              <EmptyState text="No recent results yet." />
            ) : (
              matches.recent.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Upcoming matches
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Next fixtures you might play.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {matches.upcoming.length === 0 ? (
              <EmptyState text="No upcoming matches scheduled." />
            ) : (
              matches.upcoming.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-100">Squad / roster</h2>
          <p className="text-xs text-slate-500">
            Players listed by the organizer.
          </p>
        </div>

        {team.players.length === 0 ? (
          <EmptyState text="No squad submitted yet." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            <div className="grid grid-cols-1 border-b border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400 sm:grid-cols-4">
              <span className="sm:col-span-2">Player</span>
              <span className="sm:col-span-1">Position</span>
              <span className="sm:col-span-1 text-right">Profile</span>
            </div>

            {team.players.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-1 items-center gap-3 border-b border-slate-900/70 px-4 py-3 last:border-b-0 sm:grid-cols-4"
              >
                <div className="flex items-center gap-2 sm:col-span-2 min-w-0">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-300">
                      {p.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {p.name}
                      {p.nickname ? (
                        <span className="ml-2 text-[11px] text-slate-400">
                          ({p.nickname})
                        </span>
                      ) : null}
                    </p>
                    {p.idNumber ? (
                      <p className="mt-0.5 text-[11px] font-mono text-slate-500">
                        ID: {p.idNumber}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="sm:col-span-1 text-sm text-slate-300">
                  {p.position ?? "—"}
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <Link
                    href={`/player/${p.id}`}
                    className="rounded-lg border border-slate-700 px-2 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-slate-100">Team stats</h2>
          <p className="mt-1 text-xs text-slate-500">
            Public performance summary (from match results).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Stat label="Goals" value={performance.goalsFor} />
            <Stat label="Conceded" value={performance.goalsAgainst} />
            <Stat label="Points" value={performance.points} />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-100">Top performer</h2>
          <p className="mt-1 text-xs text-slate-500">
            Highest goal scorer in this team (preview).
          </p>
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
            {topScorer ? (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">
                    {topScorer.playerName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Player is tracked via match events.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Goals</p>
                  <p className="text-lg font-bold text-emerald-300 tabular-nums">
                    {topScorer.goals}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No goal data yet.
              </p>
            )}
          </div>
        </Card>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Media / gallery preview</h2>
        <p className="mt-1 text-xs text-slate-500">
          Media assets are tournament-scoped for MVP. Team-specific gallery
          will be added next.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-slate-100">About team</h2>
          <p className="mt-1 text-xs text-slate-500">
            Short description and manager/coach details will be added when the
            team profile schema is extended.
          </p>
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
            MVP fields:
            <div className="mt-1 space-y-1">
              <p>• Team name + logo</p>
              <p>• Organizer curated roster</p>
              <p>• Match results + standings snapshot</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-100">Honors / achievements</h2>
          <p className="mt-1 text-xs text-slate-500">
            Honors will be derived from tournament history in a later iteration.
          </p>
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
            No honors tracked yet.
          </div>
        </Card>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-slate-50 tabular-nums">
        {value}
      </p>
    </div>
  );
}

function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-800 bg-slate-950 p-4 ${
        className ?? ""
      }`}
    >
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-6 text-sm text-slate-400">
      {text}
    </div>
  );
}

function MatchRow({ match }: { match: PublicTeamMatch }) {
  const isFinished = match.resultBadge != null;
  const badgeClass =
    match.resultBadge === "W"
      ? "border-emerald-800 bg-emerald-950/20 text-emerald-200"
      : match.resultBadge === "D"
        ? "border-amber-800 bg-amber-950/20 text-amber-200"
        : match.resultBadge === "L"
          ? "border-red-800 bg-red-950/20 text-red-200"
          : "border-slate-800 bg-slate-900 text-slate-300";

  const scheduledLabel = match.scheduledAt
    ? new Date(match.scheduledAt).toLocaleString()
    : "TBD";

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">
            {match.tournamentName} · {match.tournamentSport}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {scheduledLabel}
            {match.roundLabel ? ` · ${match.roundLabel}` : ""}
          </p>
          {match.tournamentLocation ? (
            <p className="mt-1 text-[11px] text-slate-500">
              Venue: {match.tournamentLocation}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {isFinished ? (
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}
            >
              {match.resultBadge}
            </span>
          ) : (
            <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
              {match.status}
            </span>
          )}
          <div className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-100 tabular-nums">
            {match.scoreText ?? "-"}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-300">
        Vs <span className="font-semibold text-slate-100">{match.opponentTeamName}</span>
      </p>
      <div className="mt-2 text-xs text-slate-500">
        <a
          href={`/match/${match.id}`}
          className="text-emerald-300 hover:text-emerald-200"
        >
          Match detail →
        </a>
      </div>
    </article>
  );
}

