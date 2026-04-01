CREATE OR REPLACE FUNCTION public.rpc_update_match_details(
  p_match_id uuid,
  p_home_team_id uuid,
  p_away_team_id uuid,
  p_scheduled_at timestamptz DEFAULT NULL,
  p_round_label text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match_tournament_id uuid;
BEGIN
  SELECT m.tournament_id INTO match_tournament_id
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF match_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(match_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to update this match';
  END IF;

  IF p_home_team_id IS NULL OR p_away_team_id IS NULL THEN
    RAISE EXCEPTION 'Both teams are required';
  END IF;

  IF p_home_team_id = p_away_team_id THEN
    RAISE EXCEPTION 'Home and away teams must be different';
  END IF;

  UPDATE public.matches
  SET
    home_team_id = p_home_team_id,
    away_team_id = p_away_team_id,
    scheduled_at = p_scheduled_at,
    round_label = NULLIF(p_round_label, '')
  WHERE id = p_match_id;

  RETURN jsonb_build_object('ok', true, 'tournament_id', match_tournament_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_match_details(uuid, uuid, uuid, timestamptz, text) TO authenticated;
