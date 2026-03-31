export type TournamentStatus =
  | "draft"
  | "upcoming"
  | "ongoing"
  | "completed"
  | "archived";

export interface OrganizerOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface OrganizerTournament {
  id: string;
  name: string;
  slug: string;
  status: TournamentStatus;
  startDate: string | null;
  endDate: string | null;
  organizationId: string | null;
  organizationName: string | null;
  teamCount: number;
  pendingCount: number;
  matchCount: number;
}

export interface OrganizerMatch {
  id: string;
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  homeTeamName: string | null;
  awayTeamName: string | null;
  scheduledAt: string | null;
  status: string;
  roundLabel: string | null;
  homeScore: number;
  awayScore: number;
}

export interface OrganizerAlert {
  id: string;
  type: "pending_approvals" | "unscheduled_matches" | "missing_results" | "draft_incomplete";
  message: string;
  count: number;
  tournamentId?: string;
  tournamentName?: string;
  href?: string;
}

export interface OrganizerDashboardStats {
  activeTournaments: number;
  totalTeams: number;
  matchesToday: number;
  pendingRegistrations: number;
  revenue?: number;
}

export interface OrganizerDashboardData {
  organizations: OrganizerOrganization[];
  stats: OrganizerDashboardStats;
  tournaments: OrganizerTournament[];
  alerts: OrganizerAlert[];
  upcomingMatches: OrganizerMatch[];
}
