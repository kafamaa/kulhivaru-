import Image from "next/image";
import Link from "next/link";

import type { PublicPlayerProfile } from "@/src/features/players/queries/get-public-player-profile";

export function PlayerHeader({
  profile,
}: {
  profile: PublicPlayerProfile;
}) {
  const team = profile.team;
  const primaryTournament = profile.tournaments[0] ?? null;
  const tournamentLabel =
    primaryTournament?.tournamentName ?? "Tournament";
  const categoryLabel = primaryTournament?.categoryDivision ?? "Division";

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-900/35 via-slate-900/70 to-slate-950/90 p-6 backdrop-blur-md shadow-[0_25px_110px_rgba(2,132,199,0.15)]">
        <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-cyan-300/30 bg-white/10">
              {profile.playerAvatarUrl ? (
                <Image
                  src={profile.playerAvatarUrl}
                  alt={profile.playerName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm font-bold text-slate-300">
                  {profile.playerName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-3xl font-bold tracking-tight text-slate-50">
                {profile.playerName}
              </h1>
              <div className="mt-1 text-sm text-cyan-100/80">
                {profile.nickname ? `${profile.nickname} · ` : ""}
                {profile.position ?? profile.preferredPosition ?? "Position TBD"}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {team?.teamId ? (
                  <Link
                    href={`/team/${team.teamId}`}
                    className="inline-flex items-center rounded-2xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
                  >
                    {team.teamName}
                  </Link>
                ) : (
                  <span className="inline-flex items-center rounded-2xl border border-cyan-300/20 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300">
                    Team TBD
                  </span>
                )}
                <span className="inline-flex items-center rounded-2xl border border-cyan-300/20 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200">
                  {tournamentLabel}
                </span>
                <span className="inline-flex items-center rounded-2xl border border-cyan-300/20 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200">
                  {categoryLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                Jersey{" "}
                {profile.jerseyNumber ? (
                  <span className="font-bold tabular-nums text-white">
                    {profile.jerseyNumber}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </span>
              <span className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                Status{" "}
                <span className="font-bold text-white">
                  {profile.statusBadge}
                </span>
              </span>
            </div>

            {primaryTournament?.tournamentSlug ? (
              <Link
                href={`/t/${primaryTournament.tournamentSlug}`}
                className="inline-flex items-center rounded-2xl border border-cyan-300/35 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/25"
              >
                View Tournament →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

