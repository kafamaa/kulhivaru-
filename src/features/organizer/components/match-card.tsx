import Link from "next/link";
import type { OrganizerMatch } from "../types";

interface MatchCardProps {
  match: OrganizerMatch;
}

export function MatchCard({ match }: MatchCardProps) {
  const timeLabel = match.scheduledAt
    ? new Date(match.scheduledAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "TBD";

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{match.tournamentName}</p>
        <p className="mt-0.5 font-medium text-slate-100">
          {match.homeTeamName ?? "TBD"} vs {match.awayTeamName ?? "TBD"}
        </p>
        <p className="text-xs text-slate-400">{timeLabel}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link
          href={`/organizer/t/${match.tournamentId}/matches`}
          className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          Open fixtures
        </Link>
        <Link
          href={`/organizer/match/${match.id}`}
          className="rounded-lg bg-emerald-500/20 px-2 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30"
        >
          Record score
        </Link>
      </div>
    </div>
  );
}
