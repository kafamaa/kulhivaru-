-- Option A: Each organizer has exactly one organization ("My Organization")
-- Link organizations to profiles and scope reads/writes to the owner.

-- 1) Add owner_id and enforce one org per owner
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- One organization per owner (only when owner_id is present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organizations_owner_id_unique'
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_owner_id_unique UNIQUE (owner_id);
  END IF;
END $$;

-- 2) RLS: organizations readable/writable only by owner
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organizations: owner can select" ON public.organizations;
CREATE POLICY "Organizations: owner can select"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Organizations: owner can insert" ON public.organizations;
CREATE POLICY "Organizations: owner can insert"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Organizations: owner can update" ON public.organizations;
CREATE POLICY "Organizations: owner can update"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 3) RLS: tournaments readable/writable only if their organization is owned by the user
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Tournaments: owner can select" ON public.tournaments;
CREATE POLICY "Tournaments: owner can select"
  ON public.tournaments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = organization_id
        AND o.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tournaments: owner can insert" ON public.tournaments;
CREATE POLICY "Tournaments: owner can insert"
  ON public.tournaments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = organization_id
        AND o.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tournaments: owner can update" ON public.tournaments;
CREATE POLICY "Tournaments: owner can update"
  ON public.tournaments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = organization_id
        AND o.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = organization_id
        AND o.owner_id = auth.uid()
    )
  );

-- 4) Helper: ensure the current organizer has an organization
CREATE OR REPLACE FUNCTION public.ensure_my_organization()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  role text;
  org_id uuid;
  org_slug text;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.role INTO role
  FROM public.profiles p
  WHERE p.id = uid;

  IF role IS NULL OR role NOT IN ('organizer','admin') THEN
    RAISE EXCEPTION 'Organizer access required';
  END IF;

  SELECT o.id INTO org_id
  FROM public.organizations o
  WHERE o.owner_id = uid
  LIMIT 1;

  IF org_id IS NOT NULL THEN
    RETURN org_id;
  END IF;

  org_slug := 'org-' || left(uid::text, 8);
  INSERT INTO public.organizations (name, slug, owner_id)
  VALUES ('My Organization', org_slug, uid)
  ON CONFLICT (slug) DO UPDATE
    SET owner_id = EXCLUDED.owner_id,
        name = EXCLUDED.name
  RETURNING id INTO org_id;

  RETURN org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_my_organization() TO authenticated;

