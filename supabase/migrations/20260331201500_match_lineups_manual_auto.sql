-- Match lineups storage for organizer manual/auto selection.
-- MVP policy: authenticated users can manage lineups.

CREATE TABLE IF NOT EXISTS public.match_lineups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('starting', 'substitute')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'auto')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, player_id)
);

CREATE INDEX IF NOT EXISTS match_lineups_match_idx ON public.match_lineups(match_id);
CREATE INDEX IF NOT EXISTS match_lineups_team_idx ON public.match_lineups(team_id);
CREATE INDEX IF NOT EXISTS match_lineups_role_idx ON public.match_lineups(role);

CREATE OR REPLACE FUNCTION public._match_lineups_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS match_lineups_set_updated_at ON public.match_lineups;
CREATE TRIGGER match_lineups_set_updated_at
  BEFORE UPDATE ON public.match_lineups
  FOR EACH ROW
  EXECUTE FUNCTION public._match_lineups_set_updated_at();

ALTER TABLE public.match_lineups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read match_lineups" ON public.match_lineups;
CREATE POLICY "Allow authenticated read match_lineups"
  ON public.match_lineups FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert match_lineups" ON public.match_lineups;
CREATE POLICY "Allow authenticated insert match_lineups"
  ON public.match_lineups FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update match_lineups" ON public.match_lineups;
CREATE POLICY "Allow authenticated update match_lineups"
  ON public.match_lineups FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete match_lineups" ON public.match_lineups;
CREATE POLICY "Allow authenticated delete match_lineups"
  ON public.match_lineups FOR DELETE TO authenticated
  USING (true);
