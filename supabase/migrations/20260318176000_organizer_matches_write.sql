-- Allow organizers to manage matches (schedule, update results, create fixtures).
-- NOTE: permissive authenticated CRUD. Tighten to org ownership later.

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read matches" ON public.matches;
CREATE POLICY "Allow authenticated read matches"
  ON public.matches FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert matches" ON public.matches;
CREATE POLICY "Allow authenticated insert matches"
  ON public.matches FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update matches" ON public.matches;
CREATE POLICY "Allow authenticated update matches"
  ON public.matches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete matches" ON public.matches;
CREATE POLICY "Allow authenticated delete matches"
  ON public.matches FOR DELETE TO authenticated USING (true);

