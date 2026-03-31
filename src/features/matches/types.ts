export interface PublicMatchPreview {
  id: string;
  tournamentName: string;
  tournamentSlug: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogoUrl?: string | null;
  awayTeamLogoUrl?: string | null;
  statusLabel: string; // "Live 65’", "Today 20:30", "FT 2-1"
  score?: string | null;
}

