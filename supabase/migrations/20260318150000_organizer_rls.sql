-- Allow authenticated users (organizers/admins) to read data for the organizer dashboard.
-- Restrict by organization membership later if needed.

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read organizations" ON public.organizations;
CREATE POLICY "Allow authenticated read organizations"
  ON public.organizations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read tournaments" ON public.tournaments;
CREATE POLICY "Allow authenticated read tournaments"
  ON public.tournaments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read team_entries" ON public.team_entries;
CREATE POLICY "Allow authenticated read team_entries"
  ON public.team_entries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read matches" ON public.matches;
CREATE POLICY "Allow authenticated read matches"
  ON public.matches FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read teams" ON public.teams;
CREATE POLICY "Allow authenticated read teams"
  ON public.teams FOR SELECT TO authenticated USING (true);

-- Profiles: app reads roles from public.profiles.role
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
