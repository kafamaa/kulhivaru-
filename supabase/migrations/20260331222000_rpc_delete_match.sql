CREATE OR REPLACE FUNCTION public.rpc_delete_match(
  p_match_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament_id uuid;
  v_deleted int := 0;
BEGIN
  SELECT m.tournament_id INTO v_tournament_id
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF v_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(v_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to delete this match';
  END IF;

  DELETE FROM public.matches
  WHERE id = p_match_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  IF v_deleted = 0 THEN
    RAISE EXCEPTION 'Match was not deleted';
  END IF;

  RETURN jsonb_build_object('ok', true, 'deleted', v_deleted, 'tournament_id', v_tournament_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_delete_match(uuid) TO authenticated;
