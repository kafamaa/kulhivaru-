-- Update minute for an existing match event (RPC-only write path)

CREATE OR REPLACE FUNCTION public.rpc_update_match_event_minute(
  p_match_id uuid,
  p_event_id uuid,
  p_minute int
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
    RAISE EXCEPTION 'Not authorized to manage this match';
  END IF;

  UPDATE public.match_events
  SET minute = p_minute
  WHERE id = p_event_id
    AND match_id = p_match_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_match_event_minute(uuid, uuid, int) TO authenticated;
