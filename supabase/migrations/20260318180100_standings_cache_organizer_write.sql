-- Organizer write access for standings_cache recompute (MVP)
-- Note: current project uses broad authenticated write policies in several places.
-- Tighten to organization ownership later.

ALTER TABLE public.standings_cache ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Safe no-op if policy already exists (Supabase doesn't support IF NOT EXISTS for policies).
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

CREATE POLICY "Organizer write standings_cache"
ON public.standings_cache
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

