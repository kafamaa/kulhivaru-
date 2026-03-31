import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type {
  OrganizerDashboardData,
  OrganizerOrganization,
  OrganizerTournament,
  OrganizerMatch,
  OrganizerAlert,
  OrganizerDashboardStats,
} from "../../types";

export async function getOrganizerDashboardData(): Promise<OrganizerDashboardData> {
  const supabase = await createSupabaseServerClient();

  let orgsRes: { data: unknown[] | null; error: unknown };
  let tournamentsRes: { data: unknown[] | null; error: unknown };
  let teamEntriesRes: { data: unknown[] | null; error: unknown };
  let matchesRes: { data: unknown[] | null; error: unknown };

  try {
    [orgsRes, tournamentsRes, teamEntriesRes, matchesRes] = await Promise.all([
    supabase.from("organizations").select("id, name, slug").order("name"),
    supabase
      .from("tournaments")
      .select("id, name, slug, status, start_date, end_date, organization_id")
      .order("created_at", { ascending: false }),
    supabase.from("team_entries").select("tournament_id, status"),
    supabase
      .from("matches")
      .select(
        "id, tournament_id, scheduled_at, status, round_label, home_score, away_score, home_team_id, away_team_id"
      ),
    ]);
  } catch {
    return {
      organizations: [],
      stats: { activeTournaments: 0, totalTeams: 0, matchesToday: 0, pendingRegistrations: 0 },
      tournaments: [],
      alerts: [],
      upcomingMatches: [],
    };
  }

  const organizations: OrganizerOrganization[] = (orgsRes.data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
  }));

  const tournamentsRows = tournamentsRes.data ?? [];
  const teamEntries = teamEntriesRes.data ?? [];
  const matchesRows = matchesRes.data ?? [];

  const teamIds = new Set<string>();
  matchesRows.forEach((m: Record<string, unknown>) => {
    if (m.home_team_id) teamIds.add(m.home_team_id as string);
    if (m.away_team_id) teamIds.add(m.away_team_id as string);
  });
  const teamIdList = Array.from(teamIds);
  let teamsMap: Record<string, string> = {};
  if (teamIdList.length > 0) {
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", teamIdList);
    teamsMap = (teams ?? []).reduce(
      (acc: Record<string, string>, t: Record<string, unknown>) => {
        acc[t.id as string] = (t.name as string) ?? "TBD";
        return acc;
      },
      {}
    );
  }

  const pendingByTournament: Record<string, number> = {};
  const approvedByTournament: Record<string, number> = {};
  const matchCountByTournament: Record<string, number> = {};
  let totalTeams = 0;
  let pendingRegistrations = 0;

  teamEntries.forEach((te: Record<string, unknown>) => {
    const tid = te.tournament_id as string;
    const status = te.status as string;
    if (status === "pending") {
      pendingByTournament[tid] = (pendingByTournament[tid] ?? 0) + 1;
      pendingRegistrations++;
    } else if (status === "approved") {
      approvedByTournament[tid] = (approvedByTournament[tid] ?? 0) + 1;
      totalTeams++;
    }
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const isoTodayStart = todayStart.toISOString();
  const isoTodayEnd = todayEnd.toISOString();
  const threeDaysEnd = new Date(todayStart.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

  let matchesToday = 0;
  const upcomingMatchesList: OrganizerMatch[] = [];

  const orgById = organizations.reduce(
    (acc, o) => {
      acc[o.id] = o.name;
      return acc;
    },
    {} as Record<string, string>
  );

  tournamentsRows.forEach((t: Record<string, unknown>) => {
    matchCountByTournament[t.id as string] = 0;
  });
  matchesRows.forEach((m: Record<string, unknown>) => {
    const tid = m.tournament_id as string;
    matchCountByTournament[tid] = (matchCountByTournament[tid] ?? 0) + 1;
    const scheduled = m.scheduled_at as string | null;
    if (scheduled) {
      if (scheduled >= isoTodayStart && scheduled < isoTodayEnd) matchesToday++;
      if (scheduled >= isoTodayStart && scheduled <= threeDaysEnd) {
        const tRow = tournamentsRows.find((x: Record<string, unknown>) => x.id === tid);
        upcomingMatchesList.push({
          id: m.id as string,
          tournamentId: tid,
          tournamentName: (tRow?.name as string) ?? "",
          tournamentSlug: (tRow?.slug as string) ?? "",
          homeTeamName: m.home_team_id ? teamsMap[m.home_team_id as string] ?? "TBD" : "TBD",
          awayTeamName: m.away_team_id ? teamsMap[m.away_team_id as string] ?? "TBD" : "TBD",
          scheduledAt: scheduled,
          status: m.status as string,
          roundLabel: (m.round_label as string) ?? null,
          homeScore: (m.home_score as number) ?? 0,
          awayScore: (m.away_score as number) ?? 0,
        });
      }
    }
  });

  upcomingMatchesList.sort(
    (a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "")
  );

  const tournaments: OrganizerTournament[] = tournamentsRows.map(
    (t: Record<string, unknown>) => ({
      id: t.id as string,
      name: t.name as string,
      slug: t.slug as string,
      status: t.status as OrganizerTournament["status"],
      startDate: (t.start_date as string) ?? null,
      endDate: (t.end_date as string) ?? null,
      organizationId: (t.organization_id as string) ?? null,
      organizationName: t.organization_id ? orgById[t.organization_id as string] ?? null : null,
      teamCount: approvedByTournament[t.id as string] ?? 0,
      pendingCount: pendingByTournament[t.id as string] ?? 0,
      matchCount: matchCountByTournament[t.id as string] ?? 0,
    })
  );

  const activeTournaments = tournaments.filter((t) =>
    ["draft", "upcoming", "ongoing"].includes(t.status)
  ).length;

  const stats: OrganizerDashboardStats = {
    activeTournaments,
    totalTeams,
    matchesToday,
    pendingRegistrations,
  };

  const alerts: OrganizerAlert[] = [];
  tournaments.forEach((t) => {
    const pending = pendingByTournament[t.id] ?? 0;
    if (pending > 0) {
      alerts.push({
        id: `pending-${t.id}`,
        type: "pending_approvals",
        message: `${pending} team${pending !== 1 ? "s" : ""} waiting for approval`,
        count: pending,
        tournamentId: t.id,
        tournamentName: t.name,
        href: `/organizer/t/${t.id}/teams`,
      });
    }
  });

  const unscheduledMatches = matchesRows.filter(
    (m: Record<string, unknown>) =>
      (m.status as string) === "scheduled" && !m.scheduled_at
  );
  if (unscheduledMatches.length > 0) {
    alerts.push({
      id: "unscheduled-matches",
      type: "unscheduled_matches",
      message: `${unscheduledMatches.length} match${unscheduledMatches.length !== 1 ? "es" : ""} need scheduling`,
      count: unscheduledMatches.length,
      href: "/organizer/tournaments",
    });
  }

  const draftCount = tournaments.filter((t) => t.status === "draft").length;
  if (draftCount > 0) {
    alerts.push({
      id: "draft-incomplete",
      type: "draft_incomplete",
      message: `${draftCount} draft tournament${draftCount !== 1 ? "s" : ""} — complete setup to publish`,
      count: draftCount,
      href: "/organizer/tournaments",
    });
  }

  return {
    organizations,
    stats,
    tournaments,
    alerts,
    upcomingMatches: upcomingMatchesList.slice(0, 10),
  };
}
