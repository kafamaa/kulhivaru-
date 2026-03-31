-- Fix ambiguous "tournament_id" inside rpc_recompute_standings_cache by renaming the
-- first RETURNS TABLE column to out_tournament_id.
--
-- Postgres does not allow CREATE OR REPLACE when the OUT/return row type changes
-- (42P13). Drop dependents first, then recreate in order.

DROP FUNCTION IF EXISTS public.rpc_finalize_match_rule_aware_v2(uuid, int, int, text);
DROP FUNCTION IF EXISTS public.rpc_finalize_match_rule_aware(uuid, int, int, text);
DROP FUNCTION IF EXISTS public.rpc_recompute_standings_cache(uuid);

CREATE FUNCTION public.rpc_recompute_standings_cache(p_tournament_id uuid)
RETURNS TABLE (out_tournament_id uuid, rows_upserted int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows int := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

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
      AND m.status IN ('ft', 'completed')
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
  INSERT INTO public.standings_cache (
    tournament_id,
    group_id,
    team_id,
    rank,
    points,
    played,
    updated_at
  )
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

  RETURN QUERY
  SELECT
    p_tournament_id AS out_tournament_id,
    v_rows AS rows_upserted;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_recompute_standings_cache(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_recompute_standings_cache(uuid) TO authenticated;

-- Restored: depends on rpc_recompute_standings_cache (uses rows_upserted only).
CREATE FUNCTION public.rpc_finalize_match_rule_aware_v2(
  p_match_id uuid,
  p_home_score int,
  p_away_score int,
  p_status text DEFAULT 'ft'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_tournament_id uuid;
  v_normalized_status text;
  v_recompute_rows int := 0;
BEGIN
  SELECT m.tournament_id
  INTO v_match_tournament_id
  FROM public.matches AS m
  WHERE m.id = p_match_id;

  IF v_match_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(v_match_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to finalize this match';
  END IF;

  v_normalized_status := CASE
    WHEN lower(COALESCE(p_status, '')) IN ('ft', 'completed') THEN lower(p_status)
    ELSE 'ft'
  END;

  UPDATE public.matches
  SET
    home_score = COALESCE(p_home_score, 0),
    away_score = COALESCE(p_away_score, 0),
    status = v_normalized_status
  WHERE id = p_match_id;

  SELECT COALESCE(r.rows_upserted, 0)
  INTO v_recompute_rows
  FROM public.rpc_recompute_standings_cache(v_match_tournament_id) AS r
  LIMIT 1;

  RETURN jsonb_build_object(
    'ok', true,
    'tournament_id', v_match_tournament_id,
    'rows_upserted', COALESCE(v_recompute_rows, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_finalize_match_rule_aware_v2(uuid, int, int, text) TO authenticated;

CREATE FUNCTION public.rpc_finalize_match_rule_aware(
  p_match_id uuid,
  p_home_score int,
  p_away_score int,
  p_status text DEFAULT 'ft'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match_tournament_id uuid;
  normalized_status text;
  recompute_result record;
BEGIN
  SELECT m.tournament_id INTO match_tournament_id
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF match_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(match_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to finalize this match';
  END IF;

  normalized_status := CASE
    WHEN p_status IN ('ft', 'completed') THEN p_status
    ELSE 'ft'
  END;

  UPDATE public.matches
  SET
    home_score = COALESCE(p_home_score, 0),
    away_score = COALESCE(p_away_score, 0),
    status = normalized_status
  WHERE id = p_match_id;

  SELECT * INTO recompute_result
  FROM public.rpc_recompute_standings_cache(match_tournament_id)
  LIMIT 1;

  RETURN jsonb_build_object(
    'ok', true,
    'tournament_id', match_tournament_id,
    'rows_upserted', COALESCE(recompute_result.rows_upserted, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_finalize_match_rule_aware(uuid, int, int, text) TO authenticated;
