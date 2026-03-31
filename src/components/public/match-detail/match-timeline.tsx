import Link from "next/link";
import type { PublicMatchEvent } from "@/src/features/matches/public/queries/get-public-match-events";

function formatMinute(minute: number | null) {
  if (minute == null) return "—";
  return `${minute}'`;
}

function eventIcon(eventType: PublicMatchEvent["eventType"]) {
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

function eventTitle(eventType: PublicMatchEvent["eventType"]) {
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

export function MatchTimeline({
  matchStatus,
  events,
}: {
  matchStatus: string;
  events: PublicMatchEvent[];
}) {
  const live = matchStatus === "live";
  const finished = matchStatus === "ft" || matchStatus === "completed";

  const assistsByMinute = new Map<number, PublicMatchEvent[]>();
  const goalsByMinute = new Map<number, PublicMatchEvent[]>();

  const cards: PublicMatchEvent[] = [];
  const subs: PublicMatchEvent[] = [];

  for (const e of events) {
    if (e.minute == null) continue;
    if (e.eventType === "assist") {
      if (!assistsByMinute.has(e.minute)) assistsByMinute.set(e.minute, []);
      assistsByMinute.get(e.minute)!.push(e);
    } else if (e.eventType === "goal") {
      if (!goalsByMinute.has(e.minute)) goalsByMinute.set(e.minute, []);
      goalsByMinute.get(e.minute)!.push(e);
    } else if (e.eventType === "yellow_card" || e.eventType === "red_card") {
      cards.push(e);
    } else if (e.eventType === "sub_in" || e.eventType === "sub_out") {
      subs.push(e);
    }
  }

  // Build timeline items in chronological order.
  // We include:
  // - goal cards (with assist info merged)
  // - cards (yellow/red)
  // - substitutions
  // - standalone assists (only when no goals at that minute)
  const minutesSet = new Set<number>();
  for (const m of goalsByMinute.keys()) minutesSet.add(m);
  for (const m of cards.map((c) => c.minute).filter((m): m is number => typeof m === "number")) minutesSet.add(m);
  for (const m of subs.map((s) => s.minute).filter((m): m is number => typeof m === "number")) minutesSet.add(m);
  for (const m of assistsByMinute.keys()) minutesSet.add(m);

  const orderedMinutes = Array.from(minutesSet.values()).sort((a, b) => a - b);

  if (!live && !finished) {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.14)]">
          <h2 className="text-lg font-semibold text-slate-50">Event Timeline</h2>
          <p className="mt-1 text-sm text-slate-400">Not started</p>
        </div>
      </section>
    );
  }

  return (
    <section id="match-timeline" className="mx-auto max-w-7xl px-4 pb-12">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-[0_20px_90px_rgba(0,0,0,0.14)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Event Timeline</h2>
            <p className="mt-1 text-sm text-slate-400">
              {live ? "Live updates (snapshot)." : "Everything that happened in this match."}
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
            No events recorded yet
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {orderedMinutes.map((minute) => {
              const goalEvents = goalsByMinute.get(minute) ?? [];
              const assistEvents = assistsByMinute.get(minute) ?? [];
              const cardEvents = cards.filter((c) => c.minute === minute);
              const subEvents = subs.filter((s) => s.minute === minute);

              const assistUsed = goalEvents.length > 0;

              return (
                <div key={minute} className="space-y-2">
                  {goalEvents.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{eventIcon("goal")}</span>
                          <div className="text-sm font-semibold text-slate-50">
                            [{formatMinute(minute)}] {eventTitle("goal")}{" "}
                            {g.player?.playerName ? (
                              <span className="text-slate-200">
                                ·{" "}
                                <Link
                                  href={`/player/${g.player.playerId}`}
                                  className="hover:text-emerald-300"
                                >
                                  {g.player.playerName}
                                </Link>
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {assistEvents.length > 0 ? (
                          <div className="text-xs text-slate-400">
                            Assist:{" "}
                            <span className="text-slate-200 font-semibold">
                              {assistEvents[0]?.player?.playerId ? (
                                <Link
                                  href={`/player/${assistEvents[0].player.playerId}`}
                                  className="hover:text-emerald-300"
                                >
                                  {assistEvents[0]?.player?.playerName ?? "—"}
                                </Link>
                              ) : (
                                assistEvents[0]?.player?.playerName ?? "—"
                              )}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}

                  {cardEvents.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-2xl border p-3 ${
                        c.eventType === "yellow_card"
                          ? "border-amber-400/30 bg-amber-400/10"
                          : "border-red-400/30 bg-red-500/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">{eventIcon(c.eventType)}</span>
                          <div className="truncate text-sm font-semibold text-slate-50">
                          [{formatMinute(minute)}] {eventTitle(c.eventType)}
                          {c.player?.playerName ? (
                            <span className="text-slate-200">
                              {" "}
                              ·{" "}
                              <Link
                                href={`/player/${c.player.playerId}`}
                                className="hover:text-emerald-300"
                              >
                                {c.player.playerName}
                              </Link>
                            </span>
                          ) : null}
                          </div>
                        </div>
                        {c.player?.teamName ? (
                          <div className="text-xs text-slate-200">{c.player.teamName}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}

                  {subEvents.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">{eventIcon(s.eventType)}</span>
                          <div className="truncate text-sm font-semibold text-slate-50">
                            [{formatMinute(minute)}] {eventTitle(s.eventType)}
                            {s.player?.playerName ? (
                              <span className="text-slate-200">
                                {" "}
                                ·{" "}
                                <Link
                                  href={`/player/${s.player.playerId}`}
                                  className="hover:text-emerald-300"
                                >
                                  {s.player.playerName}
                                </Link>
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {s.player?.teamName ? (
                          <div className="text-xs text-slate-200">{s.player.teamName}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}

                  {assistEvents.length > 0 && !assistUsed ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">{eventIcon("assist")}</span>
                          <div className="truncate text-sm font-semibold text-slate-50">
                            [{formatMinute(minute)}] {eventTitle("assist")}{" "}
                            {assistEvents[0]?.player?.playerName ? `· ${assistEvents[0].player.playerName}` : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

