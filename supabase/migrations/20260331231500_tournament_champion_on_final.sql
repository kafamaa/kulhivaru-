ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS champion_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.rpc_set_tournament_champion(
  p_tournament_id uuid,
  p_team_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.rpc_can_manage_tournament(p_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to manage this tournament';
  END IF;

  IF p_team_id IS NULL THEN
    RAISE EXCEPTION 'Champion team is required';
  END IF;

  UPDATE public.tournaments
  SET champion_team_id = p_team_id
  WHERE id = p_tournament_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_set_tournament_champion(uuid, uuid) TO authenticated;
