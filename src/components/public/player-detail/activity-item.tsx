import Link from "next/link";

import type { PublicPlayerEventTimelineItem } from "@/src/features/players/queries/get-public-player-event-timeline";

function eventIcon(eventType: string) {
  switch (eventType) {
    case "goal":
      return "⚽";
    case "assist":
      return "🅰";
    case "yellow_card":
      return "🟨";
    case "red_card":
      return "🟥";
    case "sub_in":
      return "↪";
    case "sub_out":
      return "↩";
    default:
      return "•";
  }
}

function eventLabel(eventType: string) {
  switch (eventType) {
    case "goal":
      return "Goal";
    case "assist":
      return "Assist";
    case "yellow_card":
      return "Yellow Card";
    case "red_card":
      return "Red Card";
    case "sub_in":
      return "Substitution In";
    case "sub_out":
      return "Substitution Out";
    default:
      return "Event";
  }
}

export function ActivityItem({
  item,
}: {
  item: PublicPlayerEventTimelineItem;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{eventIcon(item.eventType)}</span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-50">
              {item.minute != null ? `[${item.minute}'] ` : ""}
              {eventLabel(item.eventType)} vs {item.opponentTeamName}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {item.tournamentName}
              {item.scoreText ? ` · ${item.scoreText}` : ""}{" "}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/match/${item.matchId}`}
            className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400/25 hover:text-emerald-200"
          >
            Open Match
          </Link>
        </div>
      </div>
    </div>
  );
}

