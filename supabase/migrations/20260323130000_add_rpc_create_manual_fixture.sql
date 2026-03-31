-- Create manual fixture via RPC (RPC-only write path)

CREATE OR REPLACE FUNCTION public.rpc_create_manual_fixture(
  p_tournament_id uuid,
  p_home_team_id uuid,
  p_away_team_id uuid,
  p_round_label text DEFAULT NULL,
  p_scheduled_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_match_id uuid;
BEGIN
  IF NOT public.rpc_can_manage_tournament(p_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to manage this tournament';
  END IF;

  IF p_home_team_id IS NULL OR p_away_team_id IS NULL THEN
    RAISE EXCEPTION 'Both teams are required';
  END IF;

  IF p_home_team_id = p_away_team_id THEN
    RAISE EXCEPTION 'Home and away teams must be different';
  END IF;

  INSERT INTO public.matches (
    tournament_id,
    home_team_id,
    away_team_id,
    status,
    round_label,
    scheduled_at,
    home_score,
    away_score
  )
  VALUES (
    p_tournament_id,
    p_home_team_id,
    p_away_team_id,
    'scheduled',
    NULLIF(p_round_label, ''),
    p_scheduled_at,
    0,
    0
  )
  RETURNING id INTO new_match_id;

  RETURN jsonb_build_object('ok', true, 'match_id', new_match_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_create_manual_fixture(uuid, uuid, uuid, text, timestamptz) TO authenticated;
