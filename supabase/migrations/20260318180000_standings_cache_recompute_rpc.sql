-- Standings cache recompute RPC (MVP)
-- Computes points/played from finished matches and writes to public.standings_cache.
-- Notes:
-- - This is intentionally minimal (points only, no goal difference).
-- - Assumes public.matches has: tournament_id, home_team_id, away_team_id, home_score, away_score, status.
-- - Assumes final matches have status in ('ft','completed').
-- - group_id is left NULL (phases/groups will populate later).

CREATE OR REPLACE FUNCTION public.rpc_recompute_standings_cache(p_tournament_id uuid)
RETURNS TABLE (tournament_id uuid, rows_upserted int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows int := 0;
BEGIN
  -- Only organizers/admins should use this in production.
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Wipe existing cache for tournament (MVP; later: per group/phase)
  DELETE FROM public.standings_cache sc
  WHERE sc.tournament_id = p_tournament_id;

  WITH finished AS (
    SELECT
      m.tournament_id,
      m.home_team_id,
      m.away_team_id,
      m.home_score,
      m.away_score
    FROM public.matches m
    WHERE m.tournament_id = p_tournament_id
      AND m.home_team_id IS NOT NULL
      AND m.away_team_id IS NOT NULL
      AND m.home_score IS NOT NULL
      AND m.away_score IS NOT NULL
      AND m.status IN ('ft','completed')
  ),
  per_team AS (
    SELECT
      f.tournament_id,
      x.team_id,
      COUNT(*)::int AS played,
      SUM(
        CASE
          WHEN x.is_home AND f.home_score > f.away_score THEN 3
          WHEN (NOT x.is_home) AND f.away_score > f.home_score THEN 3
          WHEN f.home_score = f.away_score THEN 1
          ELSE 0
        END
      )::int AS points
    FROM finished f
    CROSS JOIN LATERAL (
      VALUES
        (f.home_team_id, true),
        (f.away_team_id, false)
    ) AS x(team_id, is_home)
    GROUP BY f.tournament_id, x.team_id
  ),
  ranked AS (
    SELECT
      p.tournament_id,
      NULL::uuid AS group_id,
      p.team_id,
      ROW_NUMBER() OVER (ORDER BY p.points DESC, p.played DESC, p.team_id) AS rank,
      p.points,
      p.played
    FROM per_team p
  )
  INSERT INTO public.standings_cache (tournament_id, group_id, team_id, rank, points, played, updated_at)
  SELECT
    r.tournament_id,
    r.group_id,
    r.team_id,
    r.rank,
    r.points,
    r.played,
    now()
  FROM ranked r
  ON CONFLICT (tournament_id, group_id, team_id)
  DO UPDATE SET
    rank = EXCLUDED.rank,
    points = EXCLUDED.points,
    played = EXCLUDED.played,
    updated_at = now();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN QUERY SELECT p_tournament_id, v_rows;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_recompute_standings_cache(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_recompute_standings_cache(uuid) TO authenticated;

