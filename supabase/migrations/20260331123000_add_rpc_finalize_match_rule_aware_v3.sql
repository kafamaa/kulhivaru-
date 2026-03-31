-- Robust final-score RPC that avoids ambiguous helper paths by recomputing
-- standings inline.

CREATE OR REPLACE FUNCTION public.rpc_finalize_match_rule_aware_v3(
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
  v_rows_upserted int := 0;
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

  DELETE FROM public.standings_cache sc
  WHERE sc.tournament_id = v_match_tournament_id;

  WITH finished AS (
    SELECT
      m.tournament_id,
      m.home_team_id,
      m.away_team_id,
      m.home_score,
      m.away_score
    FROM public.matches AS m
    WHERE m.tournament_id = v_match_tournament_id
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
    FROM finished AS f
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
    FROM per_team AS p
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
  FROM ranked AS r
  ON CONFLICT (tournament_id, group_id, team_id)
  DO UPDATE SET
    rank = EXCLUDED.rank,
    points = EXCLUDED.points,
    played = EXCLUDED.played,
    updated_at = now();

  GET DIAGNOSTICS v_rows_upserted = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'tournament_id', v_match_tournament_id,
    'rows_upserted', COALESCE(v_rows_upserted, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_finalize_match_rule_aware_v3(uuid, int, int, text) TO authenticated;
