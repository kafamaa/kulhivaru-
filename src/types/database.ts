// Supabase Database types for GameOn.
// Regenerate with: supabase gen types typescript --project-id <id> (then merge view types below).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      tournaments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      teams: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      team_entries: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      matches: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      players: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      match_events: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      match_lineups: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      standings_cache: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      media_assets: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      profiles: {
        Row: { id: string; role: string; display_name: string | null; updated_at: string };
        Insert: { id: string; role?: string; display_name?: string | null; updated_at?: string };
        Update: { role?: string; display_name?: string | null; updated_at?: string };
      };

      tournament_categories: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      tournament_format_rules: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      sport_rule_templates: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      tournament_rule_configs: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      category_rule_configs: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      phase_rule_configs: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };

      tournament_finance_settings: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };

      finance_accounts: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };

      finance_receivables: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };

      finance_payments: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };

      finance_ledger_journals: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };

      finance_ledger_lines: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };

      finance_expenses: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };

      finance_payables: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };

      finance_income: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };

      finance_transfers: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };

      tournament_media_assets: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };

      tournament_media_albums: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: {
      public_tournaments: {
        Row: {
          id: string;
          slug: string;
          name: string;
          sport: string;
          location: string | null;
          status: string;
          start_date: string | null;
          cover_image_url: string | null;
          logo_url: string | null;
          is_featured: boolean;
          is_registration_open: boolean;
          organizer_name: string | null;
          team_count: number | null;
        };
      };
      public_matches_preview: {
        Row: {
          id: string;
          tournament_name: string;
          tournament_slug: string;
          home_team_name: string;
          away_team_name: string;
          status_label: string;
          score: string | null;
          priority: number;
          scheduled_at: string | null;
        };
      };
      platform_stats: {
        Row: {
          tournaments_hosted: number;
          matches_played: number;
          teams_registered: number;
        };
      };
      public_top_scorers: {
        Row: {
          player_id: string;
          player_name: string;
          team_name: string;
          goals: number;
        };
      };
      public_top_scorers_by_tournament: {
        Row: {
          player_id: string;
          player_name: string;
          team_name: string;
          tournament_id: string;
          tournament_slug: string;
          tournament_name: string;
          goals: number;
        };
      };
      public_standings_preview: {
        Row: {
          tournament_id: string;
          rank: number;
          team_name: string;
          team_id: string;
          points: number;
          played: number;
        };
      };
      public_featured_player: {
        Row: {
          id: string;
          name: string;
          image_url: string | null;
          position: string | null;
          team_name: string | null;
          team_id: string | null;
          goals: number;
          assists: number;
        };
      };
      public_featured_team: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          points: number;
          tournament_name: string | null;
        };
      };
      public_streams: {
        Row: {
          id: string;
          title: string;
          is_live: boolean;
          thumbnail_url: string | null;
          start_at: string | null;
          tournament_name: string | null;
          tournament_slug: string | null;
        };
      };
      public_highlights: {
        Row: {
          id: string;
          title: string;
          thumbnail_url: string | null;
          duration: string | null;
          tournament_name: string | null;
        };
      };
      public_top_assists_overall: {
        Row: {
          player_id: string;
          player_name: string;
          team_name: string;
          assists: number;
        };
      };
      public_top_assists_by_tournament: {
        Row: {
          player_id: string;
          player_name: string;
          team_name: string;
          tournament_id: string;
          tournament_slug: string;
          tournament_name: string;
          assists: number;
        };
      };
      public_top_cards_overall: {
        Row: {
          player_id: string;
          player_name: string;
          team_name: string;
          yellow_cards: number;
          red_cards: number;
        };
      };
      public_top_cards_by_tournament: {
        Row: {
          player_id: string;
          player_name: string;
          team_name: string;
          tournament_id: string;
          tournament_slug: string;
          tournament_name: string;
          yellow_cards: number;
          red_cards: number;
        };
      };
      public_team_clean_sheets_overall: {
        Row: {
          team_id: string;
          team_name: string;
          logo_url: string | null;
          clean_sheets: number;
        };
      };
      public_team_clean_sheets_by_tournament: {
        Row: {
          team_id: string;
          team_name: string;
          logo_url: string | null;
          tournament_slug: string;
          tournament_name: string;
          clean_sheets: number;
        };
      };
    };
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
}
