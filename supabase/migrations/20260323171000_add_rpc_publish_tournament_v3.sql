-- Stable publish entrypoint to avoid stale client/schema function resolution.
-- Keeps a unique non-overloaded name and forwards to v2.

CREATE OR REPLACE FUNCTION public.rpc_publish_tournament_v3(payload jsonb)
RETURNS TABLE(id uuid, slug text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.slug
  FROM public.rpc_publish_tournament_v2(payload) AS p;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_publish_tournament_v3(jsonb) TO authenticated;
