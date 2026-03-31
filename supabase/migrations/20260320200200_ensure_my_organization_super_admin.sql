-- Allow super_admin to call ensure_my_organization (bootstrap personal org if needed).

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

  IF role IS NULL OR role NOT IN ('organizer','admin','super_admin') THEN
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
