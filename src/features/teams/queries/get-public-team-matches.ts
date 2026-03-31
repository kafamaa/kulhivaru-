import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type TeamMatchResultBadge = "W" | "D" | "L";

export interface PublicTeamMatch {
  id: string;
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  tournamentSport: string;
  tournamentStatus: string;
  tournamentLocation: string | null;

  scheduledAt: string | null;
  roundLabel: string | null;

  homeTeamId: string | null;
  awayTeamId: string | null;

  homeTeamName: string;
  awayTeamName: string;

  teamId: string;
  opponentTeamId: string;
  opponentTeamName: string;

  status: string;
  resultBadge: TeamMatchResultBadge | null;

  scoreText: string | null;

  // For goal difference + stat calculations
  teamGoals: number | null;
  opponentGoals: number | null;
}

function formatScore(home: number, away: number) {
  return `${home} - ${away}`;
}

export async function getPublicTeamMatches(input: {
  teamId: string;
}): Promise<{
  recent: PublicTeamMatch[];
  upcoming: PublicTeamMatch[];
}> {
  const supabase = await createSupabaseServerClient();

  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      "id,tournament_id,status,scheduled_at,round_label,home_team_id,away_team_id,home_score,away_score,tournaments(id,name,slug,sport,status,location)"
    )
    .or(`home_team_id.eq.${input.teamId},away_team_id.eq.${input.teamId}`);

  if (error || !matches) {
    return { recent: [], upcoming: [] };
  }

  const tournamentById = new Map<string, any>();
  const teamIds = new Set<string>();
  for (const m of matches as any[]) {
    if (m.tournament_id) tournamentById.set(String(m.tournament_id), m.tournaments);
    if (m.home_team_id) teamIds.add(String(m.home_team_id));
    if (m.away_team_id) teamIds.add(String(m.away_team_id));
  }

  // Load team names for opponents
  const otherTeamIds = Array.from(teamIds).filter((id) => id !== input.teamId);
  const { data: teams } = otherTeamIds.length
    ? await supabase
        .from("teams")
        .select("id,name")
        .in("id", otherTeamIds)
    : { data: [] as any[] };
  const teamNameById = new Map<string, string>(
    (teams ?? []).map((t: any) => [String(t.id), String(t.name)])
  );
  // Ensure team itself exists even if otherTeamIds empty
  if (!teamNameById.has(input.teamId)) {
    teamNameById.set(input.teamId, input.teamId);
  }

  const now = Date.now();

  const enriched: PublicTeamMatch[] = (matches as any[]).map((m) => {
    const tournament = m.tournaments;
    const tournamentId = String(m.tournament_id);
    const tournamentName = String(tournament?.name ?? "Tournament");
    const tournamentSlug = String(tournament?.slug ?? "");
    const tournamentSport = String(tournament?.sport ?? "");
    const tournamentStatus = String(tournament?.status ?? "");
    const tournamentLocation = (tournament?.location as string | null) ?? null;

    const homeTeamId = m.home_team_id ? String(m.home_team_id) : null;
    const awayTeamId = m.away_team_id ? String(m.away_team_id) : null;
    const homeTeamName = homeTeamId
      ? (teamNameById.get(homeTeamId) as string | undefined) ?? "—"
      : "—";
    const awayTeamName =
      awayTeamId
        ? (teamNameById.get(awayTeamId) as string | undefined) ?? "—"
        : "—";

    const isHome = homeTeamId === input.teamId;
    const opponentTeamId = isHome ? (awayTeamId as string) : (homeTeamId as string);
    const opponentTeamName = opponentTeamId
      ? (teamNameById.get(opponentTeamId) as string) ?? "—"
      : "—";

    const scheduledAt = m.scheduled_at ? String(m.scheduled_at) : null;
    const roundLabel = m.round_label ? String(m.round_label) : null;

    const status = String(m.status ?? "scheduled");
    const isFinished = status === "ft" || status === "completed";

    const homeScore = m.home_score != null ? Number(m.home_score) : null;
    const awayScore = m.away_score != null ? Number(m.away_score) : null;

    let resultBadge: TeamMatchResultBadge | null = null;
    let scoreText: string | null = null;
    let teamGoals: number | null = null;
    let opponentGoals: number | null = null;

    if (isFinished && homeScore != null && awayScore != null) {
      scoreText = formatScore(homeScore, awayScore);
      if (isHome) {
        teamGoals = homeScore;
        opponentGoals = awayScore;
      } else {
        teamGoals = awayScore;
        opponentGoals = homeScore;
      }

      if ((teamGoals as number) > (opponentGoals as number)) resultBadge = "W";
      else if ((teamGoals as number) < (opponentGoals as number)) resultBadge = "L";
      else resultBadge = "D";
    }

    return {
      id: String(m.id),
      tournamentId,
      tournamentName,
      tournamentSlug,
      tournamentSport,
      tournamentStatus,
      tournamentLocation,
      scheduledAt,
      roundLabel,
      homeTeamId,
      awayTeamId,
      homeTeamName,
      awayTeamName,
      teamId: input.teamId,
      opponentTeamId,
      opponentTeamName,
      status,
      resultBadge,
      scoreText,
      teamGoals,
      opponentGoals,
    };
  });

  const recent = enriched
    .filter((m) => m.resultBadge != null)
    .sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 5);

  const upcoming = enriched
    .filter((m) => {
      if (m.resultBadge != null) return false; // only not finished
      if (!m.scheduledAt) return true; // keep TBD
      const t = new Date(m.scheduledAt).getTime();
      return t >= now - 1000 * 60 * 30; // allow "just started"
    })
    .sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb;
    })
    .slice(0, 5);

  return { recent, upcoming };
}

