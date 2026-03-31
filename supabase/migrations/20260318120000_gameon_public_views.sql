-- GameOn: Public views and supporting objects for the landing page.
-- Run this in Supabase SQL Editor or via: supabase db push
-- Assumes you have (or create) tables: organizations, tournaments, teams, matches, team_entries, players, match_events, standings_cache, media_assets.

-- =============================================================================
-- 1. Base tables (skip if you already have your own schema)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sport text NOT NULL DEFAULT 'Football',
  location text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','upcoming','ongoing','completed','archived')),
  start_date date,
  end_date date,
  cover_image_url text,
  logo_url text,
  is_featured boolean DEFAULT false,
  is_registration_open boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, team_id)
);

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  home_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  away_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  home_score int DEFAULT 0,
  away_score int DEFAULT 0,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ft','completed','postponed','cancelled')),
  scheduled_at timestamptz,
  round_label text,
  live_minute int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  name text NOT NULL,
  image_url text,
  position text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('goal','assist','yellow_card','red_card','sub_in','sub_out')),
  minute int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.standings_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  group_id uuid,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  rank int NOT NULL,
  points int NOT NULL DEFAULT 0,
  played int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, group_id, team_id)
);

CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE SET NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('stream','highlight','vod')),
  is_live boolean DEFAULT false,
  thumbnail_url text,
  stream_url text,
  duration text,
  start_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- 2. Public views (RLS: enable for anon/authenticated as needed)
-- =============================================================================

-- Tournaments visible on explore/home (non-draft only). Used by public_tournaments.
CREATE OR REPLACE VIEW public.public_tournaments AS
SELECT
  t.id,
  t.slug,
  t.name,
  t.sport,
  t.location,
  t.status,
  t.start_date,
  t.cover_image_url,
  t.logo_url,
  t.is_featured,
  t.is_registration_open,
  o.name AS organizer_name,
  (SELECT COUNT(*)::int FROM public.team_entries te WHERE te.tournament_id = t.id AND te.status = 'approved') AS team_count
FROM public.tournaments t
LEFT JOIN public.organizations o ON o.id = t.organization_id
WHERE t.status IN ('upcoming','ongoing','completed');

-- RLS: allow public read on the view
ALTER VIEW public.public_tournaments SET (security_invoker = on);

-- Matches strip for homepage: live first, then upcoming by time. Used by public_matches_preview.
CREATE OR REPLACE VIEW public.public_matches_preview AS
SELECT
  m.id,
  t.name AS tournament_name,
  t.slug AS tournament_slug,
  COALESCE(h.name, 'TBD') AS home_team_name,
  COALESCE(a.name, 'TBD') AS away_team_name,
  CASE
    WHEN m.status = 'live' THEN 'Live ' || COALESCE(m.live_minute::text || '''', '')
    WHEN m.status IN ('ft','completed') THEN 'FT ' || m.home_score || '-' || m.away_score
    WHEN m.scheduled_at IS NOT NULL THEN to_char(m.scheduled_at AT TIME ZONE 'UTC', 'HH24:MI')
    ELSE 'TBD'
  END AS status_label,
  CASE WHEN m.status IN ('ft','completed','live') THEN m.home_score || '-' || m.away_score ELSE NULL END AS score,
  CASE
    WHEN m.status = 'live' THEN 0
    WHEN m.status IN ('ft','completed') THEN 1
    ELSE 2
  END AS priority,
  m.scheduled_at
FROM public.matches m
JOIN public.tournaments t ON t.id = m.tournament_id
LEFT JOIN public.teams h ON h.id = m.home_team_id
LEFT JOIN public.teams a ON a.id = m.away_team_id
WHERE t.status IN ('upcoming','ongoing','completed')
  AND m.status NOT IN ('postponed','cancelled');

ALTER VIEW public.public_matches_preview SET (security_invoker = on);

-- =============================================================================
-- 3. Platform stats (single row for hero)
-- =============================================================================

CREATE OR REPLACE VIEW public.platform_stats AS
SELECT
  (SELECT COUNT(*)::int FROM public.tournaments WHERE status IN ('upcoming','ongoing','completed')) AS tournaments_hosted,
  (SELECT COUNT(*)::int FROM public.matches WHERE status IN ('ft','completed','live')) AS matches_played,
  (SELECT COUNT(*)::int FROM public.team_entries WHERE status = 'approved') AS teams_registered;

ALTER VIEW public.platform_stats SET (security_invoker = on);

-- =============================================================================
-- 4. Top scorers (goals from match_events, join players + teams)
-- =============================================================================

CREATE OR REPLACE VIEW public.public_top_scorers AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  COALESCE(team.name, 'Unknown') AS team_name,
  COUNT(*)::int AS goals
FROM public.match_events e
JOIN public.players p ON p.id = e.player_id
LEFT JOIN public.teams team ON team.id = p.team_id
WHERE e.event_type = 'goal'
GROUP BY p.id, p.name, team.name
ORDER BY goals DESC;

ALTER VIEW public.public_top_scorers SET (security_invoker = on);

-- =============================================================================
-- 5. Standings preview (first group per tournament, top 5)
-- =============================================================================

CREATE OR REPLACE VIEW public.public_standings_preview AS
SELECT
  sc.tournament_id,
  sc.rank,
  t.name AS team_name,
  t.id AS team_id,
  sc.points,
  sc.played
FROM public.standings_cache sc
JOIN public.teams t ON t.id = sc.team_id
WHERE sc.rank <= 5
ORDER BY sc.tournament_id, sc.rank;

ALTER VIEW public.public_standings_preview SET (security_invoker = on);

-- =============================================================================
-- 6. Featured player (top scorer). App orders by goals DESC and takes first.
-- =============================================================================
CREATE OR REPLACE VIEW public.public_featured_player AS
SELECT
  p.id,
  p.name,
  p.image_url,
  p.position,
  t.name AS team_name,
  t.id AS team_id,
  (SELECT COUNT(*)::int FROM public.match_events e WHERE e.player_id = p.id AND e.event_type = 'goal') AS goals,
  (SELECT COUNT(*)::int FROM public.match_events e WHERE e.player_id = p.id AND e.event_type = 'assist') AS assists
FROM public.players p
LEFT JOIN public.teams t ON t.id = p.team_id
WHERE EXISTS (
  SELECT 1 FROM public.match_events e WHERE e.player_id = p.id AND e.event_type = 'goal'
);

ALTER VIEW public.public_featured_player SET (security_invoker = on);

-- =============================================================================
-- 7. Featured team (team with most points in standings_cache)
-- =============================================================================

CREATE OR REPLACE VIEW public.public_featured_team AS
SELECT DISTINCT ON (t.id)
  t.id,
  t.name,
  t.logo_url,
  sc.points,
  tr.name AS tournament_name
FROM public.teams t
JOIN public.standings_cache sc ON sc.team_id = t.id
JOIN public.tournaments tr ON tr.id = sc.tournament_id
ORDER BY t.id, sc.points DESC;

ALTER VIEW public.public_featured_team SET (security_invoker = on);

-- =============================================================================
-- 8. Watch: live stream + highlights
-- =============================================================================

CREATE OR REPLACE VIEW public.public_streams AS
SELECT
  m.id,
  m.title,
  m.is_live,
  m.thumbnail_url,
  m.start_at,
  t.name AS tournament_name,
  t.slug AS tournament_slug
FROM public.media_assets m
LEFT JOIN public.tournaments t ON t.id = m.tournament_id
WHERE m.type = 'stream' AND (m.is_live = true OR m.start_at > now())
ORDER BY m.is_live DESC NULLS LAST, m.start_at ASC NULLS LAST;

ALTER VIEW public.public_streams SET (security_invoker = on);

CREATE OR REPLACE VIEW public.public_highlights AS
SELECT
  m.id,
  m.title,
  m.thumbnail_url,
  m.duration,
  t.name AS tournament_name
FROM public.media_assets m
LEFT JOIN public.tournaments t ON t.id = m.tournament_id
WHERE m.type IN ('highlight','vod')
ORDER BY m.created_at DESC;

ALTER VIEW public.public_highlights SET (security_invoker = on);

-- =============================================================================
-- 9. RLS policies (allow anon to read public views; views use security_invoker)
-- =============================================================================

-- Enable RLS on base tables; then grant select on views to anon.
-- Views with security_invoker = on run with the role of the caller, so anon can select if they can select from underlying tables.
-- Easiest: grant select on the views to anon and ensure underlying tables allow read for the view owner (postgres/service role).
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
GRANT SELECT ON public.public_tournaments TO anon;
GRANT SELECT ON public.public_matches_preview TO anon;
GRANT SELECT ON public.platform_stats TO anon;
GRANT SELECT ON public.public_top_scorers TO anon;
GRANT SELECT ON public.public_standings_preview TO anon;
GRANT SELECT ON public.public_featured_player TO anon;
GRANT SELECT ON public.public_featured_team TO anon;
GRANT SELECT ON public.public_streams TO anon;
GRANT SELECT ON public.public_highlights TO anon;

-- Allow anon to read base tables (for view execution). In production you may restrict to specific columns or use a SECURITY DEFINER view.
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read organizations" ON public.organizations FOR SELECT TO anon USING (true);
CREATE POLICY "Public read tournaments" ON public.tournaments FOR SELECT TO anon USING (status IN ('upcoming','ongoing','completed'));
CREATE POLICY "Public read teams" ON public.teams FOR SELECT TO anon USING (true);
CREATE POLICY "Public read team_entries" ON public.team_entries FOR SELECT TO anon USING (true);
CREATE POLICY "Public read matches" ON public.matches FOR SELECT TO anon USING (true);
CREATE POLICY "Public read players" ON public.players FOR SELECT TO anon USING (true);
CREATE POLICY "Public read match_events" ON public.match_events FOR SELECT TO anon USING (true);
CREATE POLICY "Public read standings_cache" ON public.standings_cache FOR SELECT TO anon USING (true);
CREATE POLICY "Public read media_assets" ON public.media_assets FOR SELECT TO anon USING (true);
