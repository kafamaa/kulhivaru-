import type { PublicMatchDetail } from "../queries/get-public-match-detail";
import type { PublicMatchEvent } from "../queries/get-public-match-events";

export interface MatchLineupPlayer {
  playerId: string;
  playerName: string;
}

export interface MatchTeamLineups {
  starting: MatchLineupPlayer[];
  substitutes: MatchLineupPlayer[];
}

export interface MatchLineupsDerived {
  home: MatchTeamLineups;
  away: MatchTeamLineups;
  note?: string;
}

export function deriveMatchLineups(input: {
  match: Pick<PublicMatchDetail, "home" | "away">;
  events: PublicMatchEvent[];
}): MatchLineupsDerived {
  const homeTeamId = input.match.home?.teamId ?? null;
  const awayTeamId = input.match.away?.teamId ?? null;

  const emptyPlayers: MatchTeamLineups = { starting: [], substitutes: [] };

  const byTeam = (teamId: string | null) => {
    if (!teamId) return emptyPlayers;

    const participants = new Map<string, MatchLineupPlayer>();
    const subsSet = new Set<string>();

    for (const e of input.events) {
      const pid = e.player?.playerId;
      const tid = e.player?.teamId ?? null;
      if (!pid || tid !== teamId) continue;

      participants.set(pid, {
        playerId: pid,
        playerName: e.player?.playerName ?? "Player",
      });

      if (e.eventType === "sub_in") {
        subsSet.add(pid);
      }
    }

    const substitutes: MatchLineupPlayer[] = [];
    const starting: MatchLineupPlayer[] = [];

    for (const p of participants.values()) {
      if (subsSet.has(p.playerId)) substitutes.push(p);
      else starting.push(p);
    }

    // Stable order for consistent UI rendering.
    starting.sort((a, b) => a.playerName.localeCompare(b.playerName));
    substitutes.sort((a, b) => a.playerName.localeCompare(b.playerName));

    return { starting, substitutes };
  };

  const home = byTeam(homeTeamId);
  const away = byTeam(awayTeamId);

  // With the current schema we only know "who appeared in events".
  return {
    home,
    away,
    note:
      home.starting.length + home.substitutes.length + away.starting.length + away.substitutes.length === 0
        ? "No lineup data available yet."
        : "Lineups are derived from logged match events (starters and substitutes used).",
  };
}

