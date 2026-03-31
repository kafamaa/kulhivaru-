import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { OrganizerAlert, OrganizerMatch } from "@/src/features/organizer/types";

export interface TournamentOverviewStats {
  status: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  teamApproved: number;
  teamPending: number;
  teamRejected: number;
  matchesTotal: number;
  matchesToday: number;
  matchesUnscheduled: number;
  matchesMissingResults: number;
}

export interface TournamentOverviewData {
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  organizationId: string | null;
  stats: TournamentOverviewStats;
  alerts: OrganizerAlert[];
  upcomingMatches: OrganizerMatch[];
  recentlyUpdated: OrganizerMatch[];
}

function startOfTodayIso(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getTournamentOverview(
  tournamentId: string
): Promise<TournamentOverviewData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: tournament, error: tError } = await supabase
    .from("tournaments")
    .select("id, name, slug, status, start_date, end_date, location, organization_id")
    .eq("id", tournamentId)
    .single();

  if (tError || !tournament) return null;

  const { data: entries } = await supabase
    .from("team_entries")
    .select("status")
    .eq("tournament_id", tournamentId);

  const teamApproved = (entries ?? []).filter((e: any) => e.status === "approved").length;
  const teamPending = (entries ?? []).filter((e: any) => e.status === "pending").length;
  const teamRejected = (entries ?? []).filter((e: any) => e.status === "rejected").length;

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, tournament_id, home_team_id, away_team_id, home_score, away_score, status, scheduled_at, round_label, created_at"
    )
    .eq("tournament_id", tournamentId)
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  const { start: todayStart, end: todayEnd } = startOfTodayIso();
  const nowIso = new Date().toISOString();

  const matchList = matches ?? [];
  const matchesTotal = matchList.length;
  const matchesToday = matchList.filter((m: any) => {
    const s = m.scheduled_at as string | null;
    return s != null && s >= todayStart && s < todayEnd;
  }).length;

  const matchesUnscheduled = matchList.filter((m: any) => m.status === "scheduled" && !m.scheduled_at).length;

  const matchesMissingResults = matchList.filter((m: any) => {
    // Two common "missing result" cases:
    // 1) Match time has passed but still scheduled
    // 2) Marked completed/ft but scores are null
    const scheduledAt = m.scheduled_at as string | null;
    const status = m.status as string;
    const home = m.home_score as number | null;
    const away = m.away_score as number | null;

    const lateScheduled =
      status === "scheduled" && scheduledAt != null && scheduledAt < nowIso;
    const finishedNoScore =
      (status === "ft" || status === "completed") && (home == null || away == null);
    return lateScheduled || finishedNoScore;
  }).length;

  const teamIds = new Set<string>();
  matchList.forEach((m: any) => {
    if (m.home_team_id) teamIds.add(String(m.home_team_id));
    if (m.away_team_id) teamIds.add(String(m.away_team_id));
  });

  let teamNameById: Record<string, string> = {};
  if (teamIds.size > 0) {
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", Array.from(teamIds));
    teamNameById = (teams ?? []).reduce((acc: Record<string, string>, t: any) => {
      acc[String(t.id)] = String(t.name);
      return acc;
    }, {});
  }

  const toOrganizerMatch = (m: any): OrganizerMatch => ({
    id: String(m.id),
    tournamentId: String(m.tournament_id),
    tournamentName: String(tournament.name),
    tournamentSlug: String(tournament.slug),
    homeTeamName: m.home_team_id ? (teamNameById[String(m.home_team_id)] ?? "TBD") : "TBD",
    awayTeamName: m.away_team_id ? (teamNameById[String(m.away_team_id)] ?? "TBD") : "TBD",
    scheduledAt: (m.scheduled_at as string) ?? null,
    status: String(m.status),
    roundLabel: (m.round_label as string) ?? null,
    homeScore: (m.home_score as number) ?? 0,
    awayScore: (m.away_score as number) ?? 0,
  });

  const upcomingMatches = matchList
    .filter((m: any) => (m.scheduled_at as string | null) != null && (m.scheduled_at as string) >= nowIso)
    .slice(0, 6)
    .map(toOrganizerMatch);

  // Recent activity: completed matches sorted by scheduled_at (most recently played first)
  const recentlyUpdated = matchList
    .filter((m: any) => m.status === "ft" || m.status === "completed")
    .slice()
    .sort((a: any, b: any) => {
      const sa = a.scheduled_at as string | null;
      const sb = b.scheduled_at as string | null;
      if (!sa) return 1;
      if (!sb) return -1;
      return sb.localeCompare(sa);
    })
    .slice(0, 5)
    .map(toOrganizerMatch);

  const alerts: OrganizerAlert[] = [];
  if (teamPending > 0) {
    alerts.push({
      id: `pending-${tournamentId}`,
      type: "pending_approvals",
      message: `${teamPending} team${teamPending !== 1 ? "s" : ""} waiting for approval`,
      count: teamPending,
      tournamentId,
      tournamentName: String(tournament.name),
      href: `/organizer/t/${tournamentId}/teams`,
    });
  }
  if (matchesUnscheduled > 0) {
    alerts.push({
      id: `unscheduled-${tournamentId}`,
      type: "unscheduled_matches",
      message: `${matchesUnscheduled} match${matchesUnscheduled !== 1 ? "es" : ""} need scheduling`,
      count: matchesUnscheduled,
      tournamentId,
      tournamentName: String(tournament.name),
      href: `/organizer/t/${tournamentId}/matches`,
    });
  }
  if (matchesMissingResults > 0) {
    alerts.push({
      id: `missing-results-${tournamentId}`,
      type: "missing_results",
      message: `${matchesMissingResults} match${matchesMissingResults !== 1 ? "es" : ""} need results`,
      count: matchesMissingResults,
      tournamentId,
      tournamentName: String(tournament.name),
      href: `/organizer/t/${tournamentId}/matches`,
    });
  }
  if (String(tournament.status) === "draft") {
    alerts.push({
      id: `draft-${tournamentId}`,
      type: "draft_incomplete",
      message: "Tournament is still a draft — complete setup before publishing",
      count: 1,
      tournamentId,
      tournamentName: String(tournament.name),
      href: `/organizer/t/${tournamentId}/settings`,
    });
  }

  return {
    tournamentId: String(tournament.id),
    tournamentName: String(tournament.name),
    tournamentSlug: String(tournament.slug),
    organizationId: (tournament.organization_id as string) ?? null,
    stats: {
      status: String(tournament.status),
      startDate: (tournament.start_date as string) ?? null,
      endDate: (tournament.end_date as string) ?? null,
      location: (tournament.location as string) ?? null,
      teamApproved,
      teamPending,
      teamRejected,
      matchesTotal,
      matchesToday,
      matchesUnscheduled,
      matchesMissingResults,
    },
    alerts,
    upcomingMatches,
    recentlyUpdated,
  };
}

