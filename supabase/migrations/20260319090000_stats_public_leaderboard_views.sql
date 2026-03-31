-- Public stats leaderboard views for Assists / Cards / Clean Sheets
-- Run via: supabase db push

-- ============================================================================
-- 1. Player assists (overall)
-- ============================================================================
CREATE OR REPLACE VIEW public.public_top_assists_overall AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  COALESCE(team.name, 'Unknown') AS team_name,
  COUNT(*)::int AS assists
FROM public.match_events e
JOIN public.players p ON p.id = e.player_id
LEFT JOIN public.teams team ON team.id = p.team_id
WHERE e.event_type = 'assist'
GROUP BY p.id, p.name, team.name
ORDER BY assists DESC;

ALTER VIEW public.public_top_assists_overall SET (security_invoker = on);

-- ============================================================================
-- 2. Player assists (by tournament)
-- ============================================================================
CREATE OR REPLACE VIEW public.public_top_assists_by_tournament AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  COALESCE(team.name, 'Unknown') AS team_name,
  m.tournament_id,
  tr.slug AS tournament_slug,
  tr.name AS tournament_name,
  COUNT(*)::int AS assists
FROM public.match_events e
JOIN public.players p ON p.id = e.player_id
JOIN public.matches m ON m.id = e.match_id
JOIN public.tournaments tr ON tr.id = m.tournament_id
LEFT JOIN public.teams team ON team.id = p.team_id
WHERE e.event_type = 'assist'
  AND tr.status IN ('upcoming', 'ongoing', 'completed')
GROUP BY
  p.id, p.name, team.name,
  m.tournament_id, tr.slug, tr.name
ORDER BY assists DESC;

ALTER VIEW public.public_top_assists_by_tournament SET (security_invoker = on);

-- ============================================================================
-- 3. Player cards (overall)
-- ============================================================================
CREATE OR REPLACE VIEW public.public_top_cards_overall AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  COALESCE(team.name, 'Unknown') AS team_name,
  SUM(CASE WHEN e.event_type = 'yellow_card' THEN 1 ELSE 0 END)::int AS yellow_cards,
  SUM(CASE WHEN e.event_type = 'red_card' THEN 1 ELSE 0 END)::int AS red_cards
FROM public.match_events e
JOIN public.players p ON p.id = e.player_id
LEFT JOIN public.teams team ON team.id = p.team_id
WHERE e.event_type IN ('yellow_card', 'red_card')
GROUP BY p.id, p.name, team.name
ORDER BY yellow_cards DESC, red_cards DESC;

ALTER VIEW public.public_top_cards_overall SET (security_invoker = on);

-- ============================================================================
-- 4. Player cards (by tournament)
-- ============================================================================
CREATE OR REPLACE VIEW public.public_top_cards_by_tournament AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  COALESCE(team.name, 'Unknown') AS team_name,
  m.tournament_id,
  tr.slug AS tournament_slug,
  tr.name AS tournament_name,
  SUM(CASE WHEN e.event_type = 'yellow_card' THEN 1 ELSE 0 END)::int AS yellow_cards,
  SUM(CASE WHEN e.event_type = 'red_card' THEN 1 ELSE 0 END)::int AS red_cards
FROM public.match_events e
JOIN public.players p ON p.id = e.player_id
JOIN public.matches m ON m.id = e.match_id
JOIN public.tournaments tr ON tr.id = m.tournament_id
LEFT JOIN public.teams team ON team.id = p.team_id
WHERE e.event_type IN ('yellow_card', 'red_card')
  AND tr.status IN ('upcoming', 'ongoing', 'completed')
GROUP BY
  p.id, p.name, team.name,
  m.tournament_id, tr.slug, tr.name
ORDER BY yellow_cards DESC, red_cards DESC;

ALTER VIEW public.public_top_cards_by_tournament SET (security_invoker = on);

-- ============================================================================
-- 5. Team clean sheets (overall)
-- ============================================================================
CREATE OR REPLACE VIEW public.public_team_clean_sheets_overall AS
WITH sheets AS (
  -- Home clean sheets
  SELECT
    m.home_team_id AS team_id
  FROM public.matches m
  WHERE m.status IN ('ft', 'completed')
    AND m.home_team_id IS NOT NULL
    AND m.home_score IS NOT NULL
    AND m.home_score = 0
  UNION ALL
  -- Away clean sheets
  SELECT
    m.away_team_id AS team_id
  FROM public.matches m
  WHERE m.status IN ('ft', 'completed')
    AND m.away_team_id IS NOT NULL
    AND m.away_score IS NOT NULL
    AND m.away_score = 0
)
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.logo_url AS logo_url,
  COUNT(*)::int AS clean_sheets
FROM sheets s
JOIN public.teams t ON t.id = s.team_id
GROUP BY t.id, t.name, t.logo_url
ORDER BY clean_sheets DESC;

ALTER VIEW public.public_team_clean_sheets_overall SET (security_invoker = on);

-- ============================================================================
-- 6. Team clean sheets (by tournament)
-- ============================================================================
CREATE OR REPLACE VIEW public.public_team_clean_sheets_by_tournament AS
WITH sheets AS (
  SELECT
    m.tournament_id,
    m.home_team_id AS team_id
  FROM public.matches m
  WHERE m.status IN ('ft', 'completed')
    AND m.home_team_id IS NOT NULL
    AND m.home_score IS NOT NULL
    AND m.home_score = 0
  UNION ALL
  SELECT
    m.tournament_id,
    m.away_team_id AS team_id
  FROM public.matches m
  WHERE m.status IN ('ft', 'completed')
    AND m.away_team_id IS NOT NULL
    AND m.away_score IS NOT NULL
    AND m.away_score = 0
)
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.logo_url AS logo_url,
  tr.slug AS tournament_slug,
  tr.name AS tournament_name,
  COUNT(*)::int AS clean_sheets
FROM sheets s
JOIN public.teams t ON t.id = s.team_id
JOIN public.tournaments tr ON tr.id = s.tournament_id
WHERE tr.status IN ('upcoming', 'ongoing', 'completed')
GROUP BY t.id, t.name, t.logo_url, tr.slug, tr.name
ORDER BY clean_sheets DESC;

ALTER VIEW public.public_team_clean_sheets_by_tournament SET (security_invoker = on);

-- ============================================================================
-- 7. Grant read access for anon
-- ============================================================================
GRANT SELECT ON public.public_top_assists_overall TO anon;
GRANT SELECT ON public.public_top_assists_by_tournament TO anon;
GRANT SELECT ON public.public_top_cards_overall TO anon;
GRANT SELECT ON public.public_top_cards_by_tournament TO anon;
GRANT SELECT ON public.public_team_clean_sheets_overall TO anon;
GRANT SELECT ON public.public_team_clean_sheets_by_tournament TO anon;

