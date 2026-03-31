import type { PublicMatchEvent } from "../queries/get-public-match-events";
import type { PublicMatchDetail } from "../queries/get-public-match-detail";

export interface MatchTeamStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  substitutionsIn: number;
  substitutionsOut: number;
  eventsTotal: number;
}

export interface MatchStatsDerived {
  home: MatchTeamStats;
  away: MatchTeamStats;
}

export function deriveMatchStats(input: {
  match: Pick<PublicMatchDetail, "home" | "away">;
  events: PublicMatchEvent[];
}): MatchStatsDerived {
  const homeTeamId = input.match.home?.teamId ?? null;
  const awayTeamId = input.match.away?.teamId ?? null;

  const empty: MatchTeamStats = {
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    substitutionsIn: 0,
    substitutionsOut: 0,
    eventsTotal: 0,
  };

  const home = { ...empty };
  const away = { ...empty };

  const add = (target: typeof home, e: PublicMatchEvent) => {
    target.eventsTotal += 1;

    if (e.eventType === "goal") target.goals += 1;
    if (e.eventType === "assist") target.assists += 1;
    if (e.eventType === "yellow_card") target.yellowCards += 1;
    if (e.eventType === "red_card") target.redCards += 1;
    if (e.eventType === "sub_in") target.substitutionsIn += 1;
    if (e.eventType === "sub_out") target.substitutionsOut += 1;
  };

  for (const e of input.events) {
    const tid = e.player?.teamId ?? null;
    if (homeTeamId && tid === homeTeamId) add(home, e);
    else if (awayTeamId && tid === awayTeamId) add(away, e);
  }

  return { home, away };
}

