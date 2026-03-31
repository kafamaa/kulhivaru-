import Link from "next/link";

import type { PublicPlayerEventTimelineItem } from "@/src/features/players/queries/get-public-player-event-timeline";

import { EmptyStatePanel } from "@/src/components/public/shared/empty-state-panel";
import { GlassCard } from "@/src/components/public/shared/glass-card";

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

export function PlayerActivityPanel({
  items,
}: {
  items: PublicPlayerEventTimelineItem[];
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-50">Activity</h2>
        <p className="mt-1 text-sm text-slate-400">
          Goals, assists, cards, and substitutions across recent matches.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyStatePanel title="No recorded events" description={<>This player hasn&apos;t logged match events yet.</>} />
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <GlassCard key={`${it.matchId}:${it.id}`} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg">{eventIcon(it.eventType)}</span>
                    <span className="text-sm font-semibold text-slate-50">
                      {it.minute != null ? `[${it.minute}'] ` : ""}
                      {eventLabel(it.eventType)} vs {it.opponentTeamName}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {it.tournamentName}
                    {it.scoreText ? ` · ${it.scoreText}` : ""} · {it.status}
                  </div>
                </div>
                <div className="shrink-0">
                  <Link
                    href={`/match/${it.matchId}`}
                    className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-400/25 hover:text-emerald-200"
                  >
                    Open Match →
                  </Link>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

