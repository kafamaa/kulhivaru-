-- Allow organizers to manage team rosters (players table).
-- NOTE: This is permissive (authenticated can CRUD). Tighten later to org ownership.

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read players" ON public.players;
CREATE POLICY "Allow authenticated read players"
  ON public.players FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert players" ON public.players;
CREATE POLICY "Allow authenticated insert players"
  ON public.players FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update players" ON public.players;
CREATE POLICY "Allow authenticated update players"
  ON public.players FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete players" ON public.players;
CREATE POLICY "Allow authenticated delete players"
  ON public.players FOR DELETE TO authenticated USING (true);

