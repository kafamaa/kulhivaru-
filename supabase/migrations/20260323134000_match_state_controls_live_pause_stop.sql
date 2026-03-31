-- Add paused status and RPC for explicit match state controls

ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_status_check
  CHECK (status IN ('scheduled','live','paused','ft','completed','postponed','cancelled'));

CREATE OR REPLACE FUNCTION public.rpc_update_match_state(
  p_match_id uuid,
  p_status text,
  p_live_minute int DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match_tournament_id uuid;
  next_status text;
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

  next_status := lower(COALESCE(p_status, ''));
  IF next_status NOT IN ('scheduled','live','paused','ft','completed') THEN
    RAISE EXCEPTION 'Unsupported match state: %', p_status;
  END IF;

  UPDATE public.matches
  SET
    status = next_status,
    live_minute = CASE
      WHEN next_status = 'live' THEN COALESCE(p_live_minute, 0)
      WHEN next_status = 'paused' THEN p_live_minute
      ELSE NULL
    END
  WHERE id = p_match_id;

  RETURN jsonb_build_object(
    'ok', true,
    'tournament_id', match_tournament_id,
    'status', next_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_match_state(uuid, text, int) TO authenticated;
