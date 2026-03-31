import Image from "next/image";
import Link from "next/link";

import type { PublicTournamentFixtureItem } from "@/src/features/matches/queries/list-public-tournament-fixtures";

function TeamInline({
  team,
  label,
}: {
  team: PublicTournamentFixtureItem["home"];
  label: string;
}) {
  if (!team) {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400">
          —
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-50">
            TBA
          </div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
        {team.logoUrl ? (
          <Image src={team.logoUrl} alt="" width={40} height={40} className="h-full w-full object-cover" />
        ) : (
          <div className="text-sm font-bold text-slate-300">
            {team.teamName.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-50">
          {team.teamName}
        </div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function StatusPill({ statusLabel, variant }: { statusLabel: string; variant: "live" | "result" | "upcoming" }) {
  const cls =
    variant === "live"
      ? "border-red-400/30 bg-red-500/10 text-red-100"
      : variant === "result"
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
        : "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${cls}`}>
      {statusLabel}
    </span>
  );
}

export function FixturesMatchCard({ match }: { match: PublicTournamentFixtureItem }) {
  const isLive = match.status === "live";
  const isUpcoming = match.status === "scheduled";
  const variant: "live" | "result" | "upcoming" = isLive
    ? "live"
    : isUpcoming
      ? "upcoming"
      : "result";

  const accent =
    variant === "live"
      ? "border-red-400/30 bg-red-500/5 shadow-[0_18px_70px_rgba(239,68,68,0.12)]"
      : "border-white/10 bg-white/5";

  const rightScore =
    variant === "upcoming"
      ? match.statusLabel
      : match.scoreText ?? "—";

  const rightScoreUnit = variant === "upcoming" ? "kickoff" : "FT";

  return (
    <article className={`rounded-3xl border p-4 backdrop-blur-md ${accent}`}>
      {/* 11. Match card — must-have details */}
      <div className="flex flex-col gap-3">
        {/* Top row: phase/group + status */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">
              {match.phaseLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">
              {match.groupLabel}
            </span>
            <span className="hidden sm:inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">
              {match.tournamentSport}
            </span>
          </div>
          <StatusPill statusLabel={match.statusLabel} variant={variant} />
        </div>

        {/* Main row: teams + score/time */}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <TeamInline team={match.home} label="Home" />

          <div className="flex flex-col items-center gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                {rightScoreUnit}
              </div>
              <div className="mt-1 text-xl font-bold text-slate-50 tabular-nums">
                {rightScore}
              </div>
              {isLive ? (
                <div className="mt-1 text-[11px] font-semibold text-red-200">
                  {match.liveMinute != null ? `Minute ${match.liveMinute}'` : "Live now"}
                </div>
              ) : null}
            </div>
          </div>

          <TeamInline team={match.away} label="Away" />
        </div>

        {/* Bottom row: venue + datetime */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-400">
            {match.scheduledAt ? (
              <span className="tabular-nums">
                {match.scheduledAt.slice(0, 10)} ·{" "}
                <span className="font-semibold text-slate-300">
                  {new Date(match.scheduledAt).toISOString().slice(11, 16)} UTC
                </span>
              </span>
            ) : (
              "Time TBD"
            )}
            {match.venue ? ` · ${match.venue}` : ""}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/match/${match.id}`}
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              View Match
            </Link>
            {isLive && match.watchAvailable ? (
              <Link
                href="/watch"
                className="inline-flex items-center rounded-2xl bg-red-500/15 border border-red-400/30 px-4 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/25"
              >
                Watch →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

