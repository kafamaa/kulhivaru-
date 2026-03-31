import Link from "next/link";

export interface FeaturedPlayerData {
  id: string;
  name: string;
  teamName: string;
  teamId?: string;
  imageUrl?: string | null;
  position?: string;
  goals?: number;
  assists?: number;
}

export interface FeaturedTeamData {
  id: string;
  name: string;
  logoUrl?: string | null;
  tournamentName?: string;
  wins?: number;
  points?: number;
}

interface FeaturedPlayerTeamProps {
  player?: FeaturedPlayerData | null;
  team?: FeaturedTeamData | null;
  isLoading?: boolean;
}

export function FeaturedPlayerTeam({
  player,
  team,
  isLoading = false,
}: FeaturedPlayerTeamProps) {
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-900/70 border border-white/10 bg-white/5" />
      </section>
    );
  }

  if (!player && !team) return null;

  if (player) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            Featured player
          </h2>
          <Link
            href={`/player/${player.id}`}
            className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 transition-colors hover:border-emerald-400/40 sm:flex-row"
          >
            <div className="flex h-32 w-full shrink-0 items-center justify-center bg-slate-900 sm:h-40 sm:w-40">
              {player.imageUrl ? (
                <img
                  src={player.imageUrl}
                  alt={player.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-slate-600">
                  {player.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center p-4">
              <h3 className="font-semibold text-slate-50">{player.name}</h3>
              <p className="text-sm text-slate-400">
                {player.teamName}
                {player.position && ` · ${player.position}`}
              </p>
              <div className="mt-2 flex gap-4 text-sm">
                {player.goals != null && (
                  <span className="text-emerald-300">{player.goals} goals</span>
                )}
                {player.assists != null && (
                  <span className="text-slate-400">{player.assists} assists</span>
                )}
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">
                  View Player →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>
    );
  }

  if (team) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.35)]">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            Featured team
          </h2>
          <Link
            href={`/team/${team.id}`}
            className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 transition-colors hover:border-emerald-400/40 sm:flex-row"
          >
            <div className="flex h-28 w-full shrink-0 items-center justify-center bg-slate-900 p-6 sm:h-32 sm:w-40">
              {team.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="max-h-20 w-auto object-contain"
                />
              ) : (
                <span className="text-2xl font-bold text-slate-600">
                  {team.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center p-4">
              <h3 className="font-semibold text-slate-50">{team.name}</h3>
              {team.tournamentName && (
                <p className="text-sm text-slate-400">{team.tournamentName}</p>
              )}
              <div className="mt-2 flex gap-4 text-sm">
                {team.wins != null && (
                  <span className="text-slate-300">{team.wins} wins</span>
                )}
                {team.points != null && (
                  <span className="text-emerald-300">{team.points} pts</span>
                )}
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">
                  View Team →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>
    );
  }

  return null;
}
