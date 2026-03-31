-- Fix ambiguous "tournament_id" references in organizer match RPC paths.
-- This migration is safe to run repeatedly (CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION public.rpc_can_manage_tournament(p_tournament_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  user_role text;
  can_manage boolean;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT p.role
  INTO user_role
  FROM public.profiles p
  WHERE p.id = uid;

  IF user_role IN ('admin', 'super_admin') THEN
    RETURN true;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.tournaments t
    JOIN public.organizations o
      ON o.id = t.organization_id
    LEFT JOIN public.organization_members om
      ON om.organization_id = o.id
      AND om.profile_id = uid
      AND COALESCE(om.status, '') IN ('active', 'approved')
    WHERE t.id = p_tournament_id
      AND (o.owner_id = uid OR om.profile_id IS NOT NULL)
  )
  INTO can_manage;

  RETURN COALESCE(can_manage, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_can_manage_tournament(uuid) TO authenticated;

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
  v_match_tournament_id uuid;
  v_next_status text;
BEGIN
  SELECT m.tournament_id
  INTO v_match_tournament_id
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF v_match_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(v_match_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to manage this match';
  END IF;

  v_next_status := lower(COALESCE(p_status, ''));
  IF v_next_status NOT IN ('scheduled', 'live', 'paused', 'ft', 'completed') THEN
    RAISE EXCEPTION 'Unsupported match state: %', p_status;
  END IF;

  UPDATE public.matches
  SET
    status = v_next_status,
    live_minute = CASE
      WHEN v_next_status = 'live' THEN COALESCE(p_live_minute, 0)
      WHEN v_next_status = 'paused' THEN p_live_minute
      ELSE NULL
    END
  WHERE id = p_match_id;

  RETURN jsonb_build_object(
    'ok', true,
    'tournament_id', v_match_tournament_id,
    'status', v_next_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_match_state(uuid, text, int) TO authenticated;
