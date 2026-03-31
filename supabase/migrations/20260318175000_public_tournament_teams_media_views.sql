-- Public tournament Teams and Media tabs
-- RLS-safe via SECURITY DEFINER views + GRANT to anon/authenticated.

-- Teams in a public (non-draft) tournament by slug
CREATE OR REPLACE VIEW public.public_tournament_teams
AS
SELECT
  t.slug AS tournament_slug,
  te.status AS entry_status,
  team.id AS team_id,
  team.name AS team_name,
  team.slug AS team_slug,
  team.logo_url AS team_logo_url,
  te.created_at AS entered_at
FROM public.tournaments t
JOIN public.team_entries te ON te.tournament_id = t.id
JOIN public.teams team ON team.id = te.team_id
WHERE t.status IN ('upcoming','ongoing','completed');

-- Media assets for a public tournament by slug
CREATE OR REPLACE VIEW public.public_tournament_media
AS
SELECT
  t.slug AS tournament_slug,
  m.id,
  m.title,
  m.type,
  m.is_live,
  m.thumbnail_url,
  m.stream_url,
  m.duration,
  m.start_at,
  m.created_at
FROM public.tournaments t
JOIN public.media_assets m ON m.tournament_id = t.id
WHERE t.status IN ('upcoming','ongoing','completed');

-- Grant read access
GRANT SELECT ON public.public_tournament_teams TO anon, authenticated;
GRANT SELECT ON public.public_tournament_media TO anon, authenticated;

