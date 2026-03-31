import Image from "next/image";
import Link from "next/link";

import type { PublicMatchDetail } from "@/src/features/matches/public/queries/get-public-match-detail";
import type { MatchLineupsDerived } from "@/src/features/matches/public/lib/derive-match-lineups";

function PlayerPill({ player }: { player: { playerId: string; playerName: string } }) {
  return (
    <Link
      href={`/player/${player.playerId}`}
      className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-50 hover:border-emerald-400/25 hover:text-emerald-200"
    >
      {player.playerName}
    </Link>
  );
}

function TeamLineupBlock({
  teamName,
  teamId,
  logoUrl,
  title,
  players,
}: {
  teamName: string;
  teamId: string | null;
  logoUrl: string | null;
  title: string;
  players: Array<{ playerId: string; playerName: string }>;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {logoUrl ? (
            <Image src={logoUrl} alt="" fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm font-bold text-slate-300">
              {teamName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          {teamId ? (
            <Link
              href={`/team/${teamId}`}
              className="block truncate text-sm font-semibold text-slate-50 hover:text-emerald-300"
            >
              {teamName}
            </Link>
          ) : (
            <div className="truncate text-sm font-semibold text-slate-50">{teamName}</div>
          )}
          <div className="text-[11px] text-slate-400">{title}</div>
        </div>
        <div className="ml-auto rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
          <div className="text-[11px] font-semibold text-slate-400">Players</div>
          <div className="mt-1 text-lg font-bold text-slate-50 tabular-nums">
            {players.length}
          </div>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">
          No lineup data yet.
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {players.map((p) => (
            <PlayerPill key={p.playerId} player={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MatchLineupsPanel({
  match,
  lineups,
}: {
  match: PublicMatchDetail;
  lineups: MatchLineupsDerived;
}) {
  const homeName = match.home?.teamName ?? "Home";
  const awayName = match.away?.teamName ?? "Away";

  return (
    <section className="mx-auto max-w-7xl px-4" aria-label="Lineups / squad">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.14)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Lineups / Squad</h2>
            <p className="mt-1 text-sm text-slate-400">
              {lineups.note ?? "Lineups are derived from available match data."}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="space-y-3">
            <TeamLineupBlock
              teamName={homeName}
              teamId={match.home?.teamId ?? null}
              logoUrl={match.home?.logoUrl ?? null}
              title="Starting (from logged events)"
              players={lineups.home.starting}
            />
            <TeamLineupBlock
              teamName={homeName}
              teamId={match.home?.teamId ?? null}
              logoUrl={match.home?.logoUrl ?? null}
              title="Substitutes used"
              players={lineups.home.substitutes}
            />
          </div>

          <div className="space-y-3">
            <TeamLineupBlock
              teamName={awayName}
              teamId={match.away?.teamId ?? null}
              logoUrl={match.away?.logoUrl ?? null}
              title="Starting (from logged events)"
              players={lineups.away.starting}
            />
            <TeamLineupBlock
              teamName={awayName}
              teamId={match.away?.teamId ?? null}
              logoUrl={match.away?.logoUrl ?? null}
              title="Substitutes used"
              players={lineups.away.substitutes}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

