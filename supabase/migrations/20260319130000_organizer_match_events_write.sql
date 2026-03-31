-- Allow organizers to manage match event timeline.
-- MVP policy: allow authenticated CRUD on match_events.
-- Tighten to organizer/tournament ownership later.

ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read match_events" ON public.match_events;
CREATE POLICY "Allow authenticated read match_events"
  ON public.match_events FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert match_events" ON public.match_events;
CREATE POLICY "Allow authenticated insert match_events"
  ON public.match_events FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update match_events" ON public.match_events;
CREATE POLICY "Allow authenticated update match_events"
  ON public.match_events FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete match_events" ON public.match_events;
CREATE POLICY "Allow authenticated delete match_events"
  ON public.match_events FOR DELETE TO authenticated
  USING (true);

