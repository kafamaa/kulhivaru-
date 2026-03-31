CREATE OR REPLACE VIEW public.public_matches_preview AS
SELECT
  m.id,
  t.name AS tournament_name,
  t.slug AS tournament_slug,
  COALESCE(h.name, 'TBD') AS home_team_name,
  COALESCE(a.name, 'TBD') AS away_team_name,
  h.logo_url AS home_team_logo_url,
  a.logo_url AS away_team_logo_url,
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
