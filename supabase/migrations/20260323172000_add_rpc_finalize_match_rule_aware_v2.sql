-- Stable final-score RPC entrypoint (avoids stale old definitions in cache).
-- Self-contained implementation; does not depend on older wrappers.

CREATE OR REPLACE FUNCTION public.rpc_finalize_match_rule_aware_v2(
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
