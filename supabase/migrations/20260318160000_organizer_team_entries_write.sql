-- Organizers can manage team_entries (add, approve, reject, remove).
-- Teams: allow INSERT/UPDATE so organizers can create/edit teams when inviting.

CREATE POLICY "Allow authenticated insert team_entries"
  ON public.team_entries FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update team_entries"
  ON public.team_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete team_entries"
  ON public.team_entries FOR DELETE TO authenticated USING (true);

-- Allow organizers to create teams (for "Add team" / invite flow).
CREATE POLICY "Allow authenticated insert teams"
  ON public.teams FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update teams"
  ON public.teams FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
