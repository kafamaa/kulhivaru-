import Link from "next/link";
import type { OrganizerTournament } from "../types";

interface TournamentCardProps {
  tournament: OrganizerTournament;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-600 text-slate-200",
  upcoming: "bg-amber-500/20 text-amber-300",
  ongoing: "bg-emerald-500/20 text-emerald-300",
  completed: "bg-slate-700 text-slate-300",
  archived: "bg-slate-800 text-slate-400",
};

export function TournamentCard({ tournament }: TournamentCardProps) {
  const statusStyle =
    STATUS_STYLES[tournament.status] ?? "bg-slate-700 text-slate-300";
  const startLabel = tournament.startDate
    ? new Date(tournament.startDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-100">
            {tournament.name}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle}`}
          >
            {tournament.status}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {startLabel} · {tournament.teamCount} teams · {tournament.matchCount}{" "}
          matches
        </p>
        {tournament.pendingCount > 0 && (
          <p className="mt-1 text-xs text-amber-400">
            {tournament.pendingCount} pending approval
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={`/t/${tournament.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100"
        >
          Public page
        </Link>
        <Link
          href={`/organizer/t/${tournament.id}`}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100"
        >
          Open workspace
        </Link>
        <Link
          href={`/organizer/t/${tournament.id}/teams`}
          className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30"
        >
          Manage teams
        </Link>
      </div>
    </div>
  );
}
