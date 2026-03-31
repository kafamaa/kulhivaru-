export type TournamentStatus =
  | "draft"
  | "upcoming"
  | "ongoing"
  | "completed"
  | "archived";

export interface PublicTournamentCardData {
  id: string;
  slug: string;
  name: string;
  sport: string;
  location: string | null;
  status: TournamentStatus;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  organizerName?: string | null;
  teamCount?: number | null;
  startDate?: string | null;
  isRegistrationOpen?: boolean;
}

