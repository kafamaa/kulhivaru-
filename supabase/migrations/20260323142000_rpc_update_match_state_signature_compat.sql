-- Compatibility wrapper for clients/schema cache resolving args in a different order.
-- Canonical function:
--   rpc_update_match_state(p_match_id uuid, p_status text, p_live_minute int)
-- Wrapper below accepts:
--   rpc_update_match_state(p_live_minute int, p_match_id uuid, p_status text)

CREATE OR REPLACE FUNCTION public.rpc_update_match_state(
  p_live_minute int,
  p_match_id uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.rpc_update_match_state(
    p_match_id := p_match_id,
    p_status := p_status,
    p_live_minute := p_live_minute
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_match_state(int, uuid, text) TO authenticated;
