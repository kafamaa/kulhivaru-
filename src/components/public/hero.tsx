import Image from "next/image";
import Link from "next/link";
import type { PublicMatchPreview } from "@/src/features/matches/types";
import type {
  StandingsRowPreview,
  TopScorerPreview,
} from "@/src/components/public/stats-preview-section";

function IconTrophy(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <path d="M8 4h8v2a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H6a2 2 0 0 0 0 4h2" />
      <path d="M16 6h2a2 2 0 1 1 0 4h-2" />
      <path d="M12 10v4" />
      <path d="M9 18h6" />
      <path d="M10 14h4v4h-4z" />
    </svg>
  );
}

function IconCalendar(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  );
}

function IconUsers(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <path d="M16 19a4 4 0 0 0-8 0" />
      <circle cx="12" cy="11" r="3" />
      <path d="M22 19a4 4 0 0 0-4-4" />
      <path d="M18 8a3 3 0 1 1 0 6" />
      <path d="M2 19a4 4 0 0 1 4-4" />
      <path d="M6 8a3 3 0 1 0 0 6" />
    </svg>
  );
}

interface HeroStats {
  tournamentsHosted?: number;
  matchesPlayed?: number;
  teamsRegistered?: number;
}

interface HeroProps {
  stats?: HeroStats | null;
  liveMatchPreview?: PublicMatchPreview | null;
  standingsPreview?: StandingsRowPreview[];
  topScorersPreview?: TopScorerPreview[];
  featuredPlayer?: {
    name: string;
    imageUrl?: string | null;
    teamName?: string;
  } | null;
  featuredTeam?: {
    name: string;
    logoUrl?: string | null;
    points?: number;
  } | null;
}

export function Hero({
  stats,
  liveMatchPreview,
  standingsPreview = [],
  topScorersPreview = [],
  featuredPlayer = null,
  featuredTeam = null,
}: HeroProps) {
  const t = stats?.tournamentsHosted ?? 0;
  const m = stats?.matchesPlayed ?? 0;
  const teams = stats?.teamsRegistered ?? 0;

  const liveStatus = liveMatchPreview?.statusLabel ?? "Live";
  const liveScore = liveMatchPreview?.score ?? "–";
  const liveTournament = liveMatchPreview?.tournamentName ?? "Tournament";

  const topScorer = topScorersPreview[0];
  const topScorerGoals = topScorer?.goals ?? 0;

  const standingsRows = standingsPreview.slice(0, 4);
  const initials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950">
      {/* Background: subtle stadium glow */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-35 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.20),transparent_58%)]" />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_bottom,rgba(34,211,238,0.10),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 md:py-16 lg:py-20">
        <div className="grid gap-8 md:grid-cols-12 md:items-start">
          {/* Left: message */}
          <div className="md:col-span-7">
            <div className="mb-6 inline-flex items-center rounded-2xl border border-emerald-300/35 bg-emerald-400/10 px-3 py-2.5 shadow-[0_10px_35px_rgba(16,185,129,0.2)]">
              <div className="relative h-14 w-[280px] overflow-hidden rounded-xl bg-slate-950/40 sm:h-16 sm:w-[320px]">
                <Image
                  src="/kulhivaru-logo.png"
                  alt="Kulhivaru+"
                  fill
                  sizes="320px"
                  className="object-contain object-center p-1"
                  priority
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl md:text-5xl">
              Create, manage, and follow tournaments in one place
            </h1>
            <p className="mt-4 text-base text-slate-300 sm:text-lg">
              Fixtures, standings, live matches, and stats — all in one platform.
              Discover competitions, follow your teams, and run your own events like a pro.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/organizer/tournaments/new"
                className="inline-flex items-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <IconTrophy className="mr-2 h-4 w-4" />
                Create Tournament
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <IconCalendar className="mr-2 h-4 w-4" />
                Explore Tournaments
              </Link>
            </div>

            {(t > 0 || m > 0 || teams > 0) && (
              <div className="mt-10 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <IconTrophy className="mx-auto h-4 w-4 text-emerald-300" />
                  <div className="text-2xl font-bold text-emerald-300">{t}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Tournaments hosted
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <IconCalendar className="mx-auto h-4 w-4 text-emerald-300" />
                  <div className="text-2xl font-bold text-emerald-300">{m}</div>
                  <div className="mt-1 text-xs text-slate-400">Matches played</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <IconUsers className="mx-auto h-4 w-4 text-emerald-300" />
                  <div className="text-2xl font-bold text-emerald-300">{teams}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Teams registered
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: premium preview */}
          <div className="md:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <div className="pointer-events-none absolute inset-0 opacity-50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.20),transparent_55%)]" />
              </div>

              <div className="relative space-y-4">
                {/* Live match preview */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-200">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                      {liveStatus}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                      {liveTournament}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-[10px] font-bold text-slate-200">
                        {liveMatchPreview?.homeTeamLogoUrl ? (
                          <Image
                            src={liveMatchPreview.homeTeamLogoUrl}
                            alt={liveMatchPreview.homeTeam ?? "Home Team"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          initials(liveMatchPreview?.homeTeam ?? "Home Team")
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-50">
                          {liveMatchPreview?.homeTeam ?? "Home Team"}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          Home
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                      <div className="text-sm font-bold text-slate-50">
                        {liveScore}
                      </div>
                      <div className="text-[10px] text-slate-400">Score</div>
                    </div>
                    <div className="flex min-w-0 items-center justify-end gap-2 text-right">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-50">
                          {liveMatchPreview?.awayTeam ?? "Away Team"}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          Away
                        </div>
                      </div>
                      <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-[10px] font-bold text-slate-200">
                        {liveMatchPreview?.awayTeamLogoUrl ? (
                          <Image
                            src={liveMatchPreview.awayTeamLogoUrl}
                            alt={liveMatchPreview.awayTeam ?? "Away Team"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          initials(liveMatchPreview?.awayTeam ?? "Away Team")
                        )}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/matches"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30"
                  >
                    Open match center →
                  </Link>
                </div>

                {/* Standings mini preview */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-50">
                      Standings snapshot
                    </h3>
                    <Link
                      href="/explore?tab=standings"
                      className="text-xs font-medium text-emerald-300 hover:text-emerald-200"
                    >
                      View all →
                    </Link>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                    <div className="grid grid-cols-3 gap-2 bg-white/5 px-3 py-2 text-[11px] text-slate-400">
                      <div>#</div>
                      <div className="col-span-1">Team</div>
                      <div className="text-right">Pts</div>
                    </div>
                    <div className="divide-y divide-white/10">
                      {standingsRows.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-slate-500">
                          Standings will appear during tournament play.
                        </div>
                      ) : (
                        standingsRows.map((row) => (
                          <div
                            key={row.teamName + row.rank}
                            className="grid grid-cols-3 gap-2 px-3 py-2 text-xs"
                          >
                            <div className="text-slate-300">
                              {row.rank}
                            </div>
                            <div className="col-span-1 flex min-w-0 items-center gap-2 truncate text-slate-100">
                              <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-[9px] font-bold text-slate-200">
                                {row.logoUrl ? (
                                  <Image src={row.logoUrl} alt={row.teamName} fill className="object-cover" />
                                ) : (
                                  initials(row.teamName)
                                )}
                              </span>
                              <span className="truncate">{row.teamName}</span>
                            </div>
                            <div className="text-right font-semibold text-emerald-300">
                              {row.points}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Top scorer highlight */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-50">
                        Scorer spotlight
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Top goals this season
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                      <div className="text-lg font-bold text-emerald-300">
                        {topScorerGoals}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        goals
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-xs font-bold text-slate-200">
                        {topScorer?.imageUrl || featuredPlayer?.imageUrl ? (
                          <Image
                            src={topScorer?.imageUrl ?? featuredPlayer?.imageUrl ?? ""}
                            alt={topScorer?.name ?? featuredPlayer?.name ?? "Player"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          initials(topScorer?.name ?? featuredPlayer?.name ?? "Player")
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-50">
                          {topScorer?.name ?? "—"}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {topScorer?.teamName ?? "No scorer data yet"}
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/stats"
                      className="inline-flex shrink-0 items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/15"
                    >
                      View stats →
                    </Link>
                  </div>
                </div>

                {/* Team logo spotlight */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-50">Team spotlight</h3>
                    <Link
                      href="/explore"
                      className="text-xs font-medium text-emerald-300 hover:text-emerald-200"
                    >
                      Explore →
                    </Link>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10">
                      {featuredTeam?.logoUrl ? (
                        <img
                          src={featuredTeam.logoUrl}
                          alt={featuredTeam.name}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-sm font-bold text-slate-300">
                          {(featuredTeam?.name ?? "TM").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-100">
                        {featuredTeam?.name ?? "Top Team"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {featuredTeam?.points != null
                          ? `${featuredTeam.points} pts`
                          : "Team performance spotlight"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
