CREATE OR REPLACE FUNCTION public.rpc_sync_match_score_from_events(
  p_match_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament_id uuid;
  v_home_team_id uuid;
  v_away_team_id uuid;
  v_status text;
  v_home_score int := 0;
  v_away_score int := 0;
BEGIN
  SELECT m.tournament_id, m.home_team_id, m.away_team_id, m.status
  INTO v_tournament_id, v_home_team_id, v_away_team_id, v_status
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF v_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(v_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to sync this match';
  END IF;

  IF v_home_team_id IS NULL OR v_away_team_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'home_score', 0, 'away_score', 0);
  END IF;

  WITH goal_events AS (
    SELECT
      me.event_type,
      COALESCE(me.team_id, p.team_id) AS team_id
    FROM public.match_events me
    LEFT JOIN public.players p ON p.id = me.player_id
    WHERE me.match_id = p_match_id
      AND me.event_type IN ('goal', 'own_goal')
  )
  SELECT
    COALESCE(SUM(
      CASE
        WHEN ge.event_type = 'goal' AND ge.team_id = v_home_team_id THEN 1
        WHEN ge.event_type = 'own_goal' AND ge.team_id = v_away_team_id THEN 1
        ELSE 0
      END
    ), 0)::int,
    COALESCE(SUM(
      CASE
        WHEN ge.event_type = 'goal' AND ge.team_id = v_away_team_id THEN 1
        WHEN ge.event_type = 'own_goal' AND ge.team_id = v_home_team_id THEN 1
        ELSE 0
      END
    ), 0)::int
  INTO v_home_score, v_away_score
  FROM goal_events ge;

  UPDATE public.matches
  SET
    home_score = v_home_score,
    away_score = v_away_score
  WHERE id = p_match_id;

  IF v_status IN ('ft', 'completed') THEN
    PERFORM * FROM public.rpc_recompute_standings_cache(v_tournament_id);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'home_score', v_home_score,
    'away_score', v_away_score,
    'tournament_id', v_tournament_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_sync_match_score_from_events(uuid) TO authenticated;
