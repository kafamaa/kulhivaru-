-- Public stats: Top scorers by tournament
-- Run via: supabase db push

CREATE OR REPLACE VIEW public.public_top_scorers_by_tournament AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  COALESCE(team.name, 'Unknown') AS team_name,
  m.tournament_id,
  tr.slug AS tournament_slug,
  tr.name AS tournament_name,
  COUNT(*)::int AS goals
FROM public.match_events e
JOIN public.players p ON p.id = e.player_id
JOIN public.matches m ON m.id = e.match_id
JOIN public.tournaments tr ON tr.id = m.tournament_id
LEFT JOIN public.teams team ON team.id = p.team_id
WHERE e.event_type = 'goal'
  AND tr.status IN ('upcoming', 'ongoing', 'completed')
GROUP BY
  p.id, p.name, team.name,
  m.tournament_id, tr.slug, tr.name
ORDER BY goals DESC;

ALTER VIEW public.public_top_scorers_by_tournament SET (security_invoker = on);

GRANT SELECT ON public.public_top_scorers_by_tournament TO anon;

