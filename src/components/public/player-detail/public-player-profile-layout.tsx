"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Flag,
  Gauge,
  MapPin,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { GlassTabs } from "@/src/components/public/shared/glass-tabs";

import type {
  PublicPlayerPerformance,
} from "@/src/features/players/queries/get-public-player-performance";
import type { PublicPlayerProfile } from "@/src/features/players/queries/get-public-player-profile";
import type { PublicPlayerRankings } from "@/src/features/players/queries/get-public-player-rankings";
import type { PublicPlayerRecentMatch } from "@/src/features/players/queries/get-public-player-recent-matches";
import type { PublicPlayerTournamentContext } from "@/src/features/players/queries/get-public-player-profile";

type TabId =
  | "overview"
  | "scores"
  | "statistics"
  | "characteristics"
  | "participations"
  | "transfers"
  | "honors"
  | "news";

function formatShortDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
}

function computeEvaluation(performance: PublicPlayerPerformance): string {
  // Mirror the existing heuristic: goals and minutes matter more than assists.
  const denom = Math.max(1, performance.matchesPlayed);
  const raw =
    (performance.goals * 3 + performance.assists * 2 + performance.minutesInvolved / 15) /
    denom;
  const clamped = Math.max(0, Math.min(10, raw));
  return (Math.round(clamped * 10) / 10).toFixed(1);
}

function getAge(dateString: string | null | undefined): string {
  if (!dateString) return "Not provided";
  const dob = new Date(dateString);
  if (Number.isNaN(dob.getTime())) return "Not provided";
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return String(age);
}

function inferPlayingStyle(perf: PublicPlayerPerformance): string {
  if (perf.goals >= perf.assists && perf.goals > 0) return "Direct attacking style";
  if (perf.assists > perf.goals) return "Creative playmaker style";
  if (perf.yellowCards > 3) return "Physical defensive style";
  return "Balanced style";
}

function inferExperienceLevel(matchesPlayed: number): string {
  if (matchesPlayed >= 100) return "Veteran";
  if (matchesPlayed >= 40) return "Experienced";
  if (matchesPlayed >= 10) return "Intermediate";
  return "Developing";
}

const ACHIEVEMENT_LABELS: Record<string, string> = {
  man_of_the_match: "Man of the Match",
  mvp: "Best Player (MVP)",
  best_goalkeeper: "Best Goalkeeper",
  best_defender: "Best Defender",
  young_player: "Young Player",
  top_scorer: "Top Scorer",
  best_assist_provider: "Best Assist Provider",
  champion_trophy: "Champion Trophy",
  runner_up_trophy: "Runner-up Trophy",
};

function trophyCardTitle(item: {
  trophyTitle?: string | null;
  achievementKey: string;
  tournamentName: string;
}): string {
  if (item.trophyTitle && item.trophyTitle.trim()) return item.trophyTitle.trim();
  return `${ACHIEVEMENT_LABELS[item.achievementKey] ?? item.achievementKey} - ${item.tournamentName}`;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_10px_30px_rgba(2,6,23,0.18)]">
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-100/90">
        {title}
      </h3>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}

function Chip({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: "cyan" | "emerald" | "rose";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : tone === "rose"
        ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
        : "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

export function PublicPlayerProfileLayout({
  profile,
  performance,
  rankings,
  recentMatches,
  primaryTournament,
  primaryTournamentSlug,
}: {
  profile: PublicPlayerProfile;
  performance: PublicPlayerPerformance;
  rankings: PublicPlayerRankings;
  recentMatches: PublicPlayerRecentMatch[];
  primaryTournament: PublicPlayerTournamentContext | null;
  primaryTournamentSlug: string | null;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const positionText = profile.position ?? profile.preferredPosition ?? "Position TBD";
  const sport = primaryTournament?.tournamentSport ?? "Not provided";
  const registration = primaryTournament?.entryStatus ?? "unknown";
  const placeOfBirth = primaryTournament?.tournamentLocation ?? "TBD";
  const evaluation = computeEvaluation(performance);
  const age = getAge(profile.dob);
  const profileExtra = profile as PublicPlayerProfile & {
    atoll?: string | null;
    island?: string | null;
    country?: string | null;
  };
  const locationText =
    [profileExtra.atoll, profileExtra.island, profileExtra.country]
      .filter((part): part is string => Boolean(part && String(part).trim()))
      .join(" / ") || placeOfBirth;
  const dobAgeText = `${profile.dob ? formatShortDate(profile.dob) : "Not provided"} / ${age}`;

  const tabs = useMemo(
    () =>
      [
        { id: "overview" as const, label: "Overview" },
        { id: "scores" as const, label: "Scores & Fixtures" },
        { id: "statistics" as const, label: "Statistics" },
        { id: "characteristics" as const, label: "Characteristics" },
        { id: "participations" as const, label: "Participations" },
        { id: "transfers" as const, label: "Transfers" },
        { id: "honors" as const, label: "Honors" },
        { id: "news" as const, label: "News" },
      ] as Array<{ id: TabId; label: string }>,
    []
  );

  const latestMatches = recentMatches.slice(0, 6);
  const liveNow = recentMatches.find((m) => String(m.status).toLowerCase() === "live") ?? null;

  const playingStyle = inferPlayingStyle(performance);
  const experienceLevel = inferExperienceLevel(performance.matchesPlayed);
  const motmTotal = profile.achievements
    .filter((a) => a.achievementKey === "man_of_the_match")
    .reduce((sum, a) => sum + a.valueInt, 0);
  const totalAwards = profile.achievements.reduce((sum, a) => sum + (a.valueInt ?? 0), 0);
  const achievementTotals = profile.achievements.reduce<Record<string, number>>((acc, item) => {
    if (!item.achievementKey) return acc;
    acc[item.achievementKey] = (acc[item.achievementKey] ?? 0) + (item.valueInt ?? 0);
    return acc;
  }, {});
  const nonMotmAwards = Object.entries(achievementTotals).filter(
    ([key, value]) => key !== "man_of_the_match" && value > 0,
  );
  const trophyAwards = profile.achievements.filter(
    (a) => a.achievementKey !== "man_of_the_match" && (a.valueInt ?? 0) > 0,
  );
  const championTournaments = profile.tournaments.filter((t) => t.isChampion);

  return (
    <div className="relative">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#2f8aa2]/35 via-[#0b2d41]/25 to-[#081423]/40 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="grid lg:grid-cols-[minmax(220px,clamp(240px,36vw,380px))_1fr] lg:items-stretch">
            {/* Full-bleed photo: fills left strip top-to-bottom of the header (matches row height) */}
            <div className="relative h-64 min-h-[220px] w-full lg:h-full lg:min-h-[200px]">
              <div className="absolute inset-0">
                {/* Same base as card; only a light bottom fade so text/badge stay readable */}
                <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-[#081423]/85 via-[#081423]/20 to-transparent" />
                {profile.playerAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.playerAvatarUrl}
                    alt={profile.playerName}
                    className="relative z-10 h-full w-full object-contain object-top"
                  />
                ) : (
                  <div className="relative z-10 flex h-full w-full items-center justify-center text-4xl font-bold text-white/80">
                    {profile.playerName.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-white p-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                  {profile.team?.teamLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.team.teamLogoUrl}
                      alt={profile.team.teamName ?? "Team logo"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (profile.team?.teamName ?? "T").slice(0, 1).toUpperCase()
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-5">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
                <div className="min-w-0">
                  <div className="truncate text-3xl font-bold tracking-tight text-white">
                    {profile.playerName}
                  </div>
                  <div className="mt-1 text-sm text-white/75">
                    Public Player, {profile.nickname ?? "Not provided"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Chip tone="cyan">Sport: {sport}</Chip>
                    <Chip tone="emerald">Registration: {registration}</Chip>
                    {championTournaments.length > 0 ? (
                      <Chip tone="emerald">Champion x{championTournaments.length}</Chip>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <MetaPill icon={UserCheck} label="Position" value={positionText} />
                    <MetaPill icon={Flag} label="Team" value={profile.team?.teamName ?? "Not provided"} />
                    <MetaPill icon={MapPin} label="Atoll / Island / Country" value={locationText} />
                    <MetaPill icon={CalendarDays} label="DOB / Age" value={dobAgeText} />
                    <MetaPill icon={Gauge} label="Rating" value={evaluation} />
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:items-end">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="rounded-full bg-black/40 px-5 py-2 text-sm font-semibold text-white hover:bg-black/55"
                    >
                      SUBSCRIBE
                    </button>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
                      &#8230;
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 lg:justify-end">
                    <div className="w-[200px] rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                        Tournament entries
                      </div>
                      <div className="mt-1 text-base font-bold text-white tabular-nums">
                        {profile.tournaments.length}
                      </div>
                      <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                        Awards / Champion
                      </div>
                      <div className="mt-1 text-base font-bold text-white tabular-nums">
                        {totalAwards} / {championTournaments.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky tabs under header */}
      <GlassTabs
        tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8">
        {activeTab === "overview" ? (
          <div className="space-y-6">
            {/* Quick summary cards */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard label="Matches played" value={String(performance.matchesPlayed)} />
              <StatCard label="Goals" value={String(performance.goals)} />
              <StatCard label="Assists" value={String(performance.assists)} />
              <StatCard label="Yellow cards" value={String(performance.yellowCards)} />
              <StatCard label="Red cards" value={String(performance.redCards)} />
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                  Badge / ranking
                </div>
                <div className="mt-1 text-2xl font-bold text-white tabular-nums">
                  {rankings.topScorersRank != null ? `#${rankings.topScorersRank}` : "—"}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
              {/* Left column */}
              <div className="space-y-5">
                <SectionCard title="Latest Matches">
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                      <thead className="bg-white/5 text-slate-300">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Team 1</th>
                          <th className="px-3 py-2 text-left">Score</th>
                          <th className="px-3 py-2 text-left">Team 2</th>
                          <th className="px-3 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestMatches.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                              No matches yet.
                            </td>
                          </tr>
                        ) : (
                          latestMatches.map((m) => (
                            <tr
                              key={m.matchId}
                              className="border-t border-white/10 hover:bg-white/5"
                            >
                              <td className="px-3 py-2 text-slate-200">{formatShortDate(m.scheduledAt)}</td>
                              <td className="px-3 py-2 font-medium text-white">
                                {profile.team?.teamName ?? "Team"}
                              </td>
                              <td className="px-3 py-2 text-white/90">{m.scoreText ?? "*"}</td>
                              <td className="px-3 py-2 text-white/90">{m.opponentTeamName}</td>
                              <td className="px-3 py-2 text-slate-300">{m.status}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {liveNow ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white">Live now</div>
                        <div className="text-sm font-bold text-white tabular-nums">
                          {liveNow.scoreText ?? "—"}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white">
                          {liveNow.opponentTeamName}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profile.team?.teamId ? (
                            <Link
                              href={`/team/${profile.team.teamId}`}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10"
                            >
                              View Team
                            </Link>
                          ) : null}
                          {primaryTournamentSlug ? (
                            <Link
                              href={`/t/${primaryTournamentSlug}`}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10"
                            >
                              View Tournament
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </SectionCard>

                <SectionCard title="Recent Matches & Individual Match Performance">
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                      <thead className="bg-white/5 text-slate-300">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Opponent</th>
                          <th className="px-3 py-2 text-left">Result</th>
                          <th className="px-3 py-2 text-left">Goals</th>
                          <th className="px-3 py-2 text-left">Assists</th>
                          <th className="px-3 py-2 text-left">Cards</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentMatches.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                              No recent matches.
                            </td>
                          </tr>
                        ) : (
                          recentMatches.map((m) => (
                            <tr key={m.matchId} className="border-t border-white/10 hover:bg-white/5">
                              <td className="px-3 py-2 text-slate-200">{formatShortDate(m.scheduledAt)}</td>
                              <td className="px-3 py-2 text-white/90">{m.opponentTeamName}</td>
                              <td className="px-3 py-2 text-slate-300">{m.resultBadge ?? m.status}</td>
                              <td className="px-3 py-2 text-white/90">{m.contributions.goals}</td>
                              <td className="px-3 py-2 text-white/90">{m.contributions.assists}</td>
                              <td className="px-3 py-2 text-white/90">
                                {m.contributions.yellowCards}/{m.contributions.redCards}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>

                <SectionCard title="Tournament-wise Stats">
                  {profile.tournaments.length === 0 ? (
                    <div className="text-sm text-slate-400">No tournament history yet.</div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-white/10">
                      <table className="w-full text-sm">
                        <thead className="bg-white/5 text-slate-300">
                          <tr>
                            <th className="px-3 py-2 text-left">Tournament</th>
                            <th className="px-3 py-2 text-left">Sport</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">Champion</th>
                            <th className="px-3 py-2 text-left">Rank</th>
                            <th className="px-3 py-2 text-left">Points</th>
                            <th className="px-3 py-2 text-left">Played</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profile.tournaments.map((t) => (
                            <tr key={t.tournamentId} className="border-t border-white/10 hover:bg-white/5">
                              <td className="px-3 py-2 text-white/90">{t.tournamentName}</td>
                              <td className="px-3 py-2 text-slate-300">{t.tournamentSport}</td>
                              <td className="px-3 py-2 text-slate-300">{t.entryStatus}</td>
                              <td className="px-3 py-2 text-slate-300">
                                {t.isChampion ? (
                                  <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                                    Champion
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="px-3 py-2 text-white/90">{t.standingsRank ?? "-"}</td>
                              <td className="px-3 py-2 text-white/90">{t.standingsPoints ?? "-"}</td>
                              <td className="px-3 py-2 text-white/90">{t.standingsPlayed ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Bio & Career">
                  <div className="space-y-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                        About
                      </div>
                      <div className="mt-2 text-sm text-white/90">
                        {profile.playerName} is an active {positionText}.
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Playing style
                        </div>
                        <div className="mt-2 text-sm font-bold text-white">{playingStyle}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Experience level
                        </div>
                        <div className="mt-2 text-sm font-bold text-white">{experienceLevel}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:col-span-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Career totals
                        </div>
                        <div className="mt-2 text-sm font-bold text-white tabular-nums">
                          {performance.matchesPlayed} MP · {performance.goals} G · {performance.assists} A ·{" "}
                          {performance.yellowCards} YC · {performance.redCards} RC
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Teams played for
                        </div>
                        <div className="mt-2 text-sm font-bold text-white">
                          {profile.team?.teamName ?? "Not provided"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Tournament history
                        </div>
                        <div className="mt-2 text-sm font-bold text-white">
                          {profile.tournaments.length} tournament{profile.tournaments.length === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Titles won
                      </div>
                      <div className="mt-2 text-sm font-bold text-white">
                        MOTM awards: {motmTotal}
                      </div>
                      {nonMotmAwards.length ? (
                        <div className="mt-1 text-xs text-slate-300">
                          Tournament awards: {nonMotmAwards.length}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Trophy Cabin">
                  <div className="flex flex-wrap gap-2">
                    {motmTotal > 0 ? (
                      <Chip tone="emerald">Man of the Match x{motmTotal}</Chip>
                    ) : null}
                    {nonMotmAwards.map(([key, value]) => (
                      <Chip key={key} tone="emerald">
                        {(ACHIEVEMENT_LABELS[key] ?? key).replaceAll("_", " ")} x{value}
                      </Chip>
                    ))}
                    {rankings.topScorersRank != null ? (
                      <>
                        <Chip tone="emerald">Top Scorer #{rankings.topScorersRank}</Chip>
                        <Chip tone="cyan">Top scorer candidate ({rankings.topScorersGoals} goals)</Chip>
                      </>
                    ) : (
                      <Chip tone="cyan">Top scorer (Not available)</Chip>
                    )}
                  </div>

                  <div className="h-px w-full bg-white/10" />

                  {trophyAwards.length === 0 ? (
                    <div className="text-sm text-slate-400">No trophy awards added yet.</div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {trophyAwards.map((award) => (
                        <div
                          key={`${award.achievementKey}-${award.tournamentId}`}
                          className="rounded-xl border border-white/10 bg-white/5 p-3"
                        >
                          {award.trophyImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={award.trophyImageUrl}
                              alt={trophyCardTitle(award)}
                              className="h-28 w-full rounded-lg bg-slate-900 object-contain"
                            />
                          ) : (
                            <div className="flex h-28 w-full items-center justify-center rounded-lg border border-white/10 bg-slate-900 text-4xl">
                              🏆
                            </div>
                          )}
                          <div className="mt-2 text-sm font-semibold text-white">{trophyCardTitle(award)}</div>
                          <div className="mt-1 text-xs text-slate-400">
                            {ACHIEVEMENT_LABELS[award.achievementKey] ?? award.achievementKey} ·{" "}
                            {award.tournamentName} · x{award.valueInt}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* Right column */}
              <div className="space-y-5">
                <SectionCard title="Current Participations">
                  {profile.tournaments.length === 0 ? (
                    <div className="text-sm text-slate-400">No participations yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {profile.tournaments.slice(0, 3).map((t) => (
                        <div
                          key={t.tournamentId}
                          className="rounded-xl border border-white/10 bg-white/5 p-3"
                        >
                          <div className="text-sm font-semibold text-white">{t.tournamentName}</div>
                          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                            {t.tournamentSport} · {t.entryStatus}
                          </div>
                        {t.isChampion ? (
                          <div className="mt-2 inline-flex rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                            Champion
                          </div>
                        ) : null}
                        </div>
                      ))}
                      {profile.tournaments.length > 3 ? (
                        <div className="text-xs text-slate-300">
                          +{profile.tournaments.length - 3} more
                        </div>
                      ) : null}
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Media & Links">
                  <div className="space-y-2">
                    <InfoLine label="Photos gallery" value="Not provided" />
                    <InfoLine label="Highlight videos" value="Not provided" />
                    <InfoLine label="Social media links" value="Not provided" />
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        ) : null}

        {/* Non-overview tabs (MVP placeholders using same data) */}
        {activeTab === "scores" ? (
          <div className="space-y-5">
            <SectionCard title="Live strip + Latest matches">
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Opponent</th>
                      <th className="px-3 py-2 text-left">Score</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestMatches.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                          No matches found in database.
                        </td>
                      </tr>
                    ) : (
                      latestMatches.map((m) => (
                        <tr key={`scores-${m.matchId}`} className="border-t border-white/10 hover:bg-white/5">
                          <td className="px-3 py-2 text-slate-200">{formatShortDate(m.scheduledAt)}</td>
                          <td className="px-3 py-2 text-white/90">{m.opponentTeamName}</td>
                          <td className="px-3 py-2 text-white/90">{m.scoreText ?? "*"}</td>
                          <td className="px-3 py-2 text-slate-300">{m.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        ) : null}

        {activeTab === "statistics" ? (
          <div className="space-y-5">
            <SectionCard title="Statistics">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Matches played" value={String(performance.matchesPlayed)} />
                <StatCard label="Goals" value={String(performance.goals)} />
                <StatCard label="Assists" value={String(performance.assists)} />
                <StatCard label="Yellow / Red" value={`${performance.yellowCards} / ${performance.redCards}`} />
              </div>
            </SectionCard>
          </div>
        ) : null}

        {activeTab === "characteristics" ? (
          <div className="space-y-5">
            <SectionCard title="Characteristics">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoLine label="Position" value={positionText} />
                <InfoLine label="Playing style" value={playingStyle} />
                <InfoLine label="Preferred foot" value="Not provided" />
                <InfoLine label="Height / Weight" value="Not provided" />
              </div>
            </SectionCard>
          </div>
        ) : null}

        {activeTab === "participations" ? (
          <div className="space-y-5">
            <SectionCard title="Current Participations">
              <div className="space-y-2">
                {profile.tournaments.length === 0 ? (
                  <div className="text-sm text-slate-400">No participations yet.</div>
                ) : (
                  profile.tournaments.map((t) => (
                    <div key={t.tournamentId} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-sm font-semibold text-white">{t.tournamentName}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                        {t.tournamentSport} · {t.entryStatus}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        ) : null}

        {activeTab === "transfers" ? (
          <div className="space-y-5">
            <SectionCard title="Transfers">
              <div className="text-sm text-slate-300">
                No transfer records available in database for this player.
              </div>
            </SectionCard>
          </div>
        ) : null}

        {activeTab === "honors" ? (
          <div className="space-y-5">
            <SectionCard title="Trophy Cabin">
              <div className="flex flex-wrap gap-2">
                {motmTotal > 0 ? (
                  <Chip tone="emerald">Man of the Match x{motmTotal}</Chip>
                ) : (
                  <Chip tone="cyan">No match awards yet</Chip>
                )}
                {nonMotmAwards.map(([key, value]) => (
                  <Chip key={key} tone="emerald">
                    {(ACHIEVEMENT_LABELS[key] ?? key).replaceAll("_", " ")} x{value}
                  </Chip>
                ))}
                {rankings.topScorersRank != null ? (
                  <>
                    <Chip tone="emerald">Top Scorer #{rankings.topScorersRank}</Chip>
                    <Chip tone="cyan">Top scorer candidate ({rankings.topScorersGoals} goals)</Chip>
                  </>
                ) : (
                  <Chip tone="cyan">No public honors yet</Chip>
                )}
              </div>

              <div className="h-px w-full bg-white/10" />

              {trophyAwards.length === 0 ? (
                <div className="text-sm text-slate-400">No trophy awards added yet.</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {trophyAwards.map((award) => (
                    <div
                      key={`honors-${award.achievementKey}-${award.tournamentId}`}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      {award.trophyImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={award.trophyImageUrl}
                          alt={trophyCardTitle(award)}
                          className="h-28 w-full rounded-lg bg-slate-900 object-contain"
                        />
                      ) : (
                        <div className="flex h-28 w-full items-center justify-center rounded-lg border border-white/10 bg-slate-900 text-4xl">
                          🏆
                        </div>
                      )}
                      <div className="mt-2 text-sm font-semibold text-white">{trophyCardTitle(award)}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {award.tournamentName} · x{award.valueInt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        ) : null}

        {activeTab === "news" ? (
          <div className="space-y-5">
            <SectionCard title="News">
              <div className="text-sm text-slate-300">
                No news records available in database for this player.
              </div>
            </SectionCard>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
        {label}
      </div>
      <div className="mt-2 text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function MetaPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
      <div className="flex items-center gap-2 text-slate-300">
        <Icon className="h-3.5 w-3.5 text-cyan-200" />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

