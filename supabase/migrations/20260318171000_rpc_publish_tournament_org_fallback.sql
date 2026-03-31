-- Fix: rpc_publish_tournament should not fail when no organizations exist.
-- If payload doesn't provide organization_id and none exist, create a default org.

CREATE OR REPLACE FUNCTION public.rpc_publish_tournament(payload jsonb)
RETURNS TABLE(id uuid, slug text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  role text;
  org_id uuid;
  base_slug text;
  final_slug text;
  n int := 0;
  tname text;
  sport text;
  location text;
  start_date date;
  end_date date;
  logo_url text;
  cover_image_url text;
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

  -- Option A: use the user's single organization (create it if missing).
  org_id := NULLIF(payload->>'organization_id', '')::uuid;
  IF org_id IS NULL THEN
    org_id := public.ensure_my_organization();
  END IF;

  tname := COALESCE(payload #>> '{basics,tournamentName}', '');
  IF length(trim(tname)) < 3 THEN
    RAISE EXCEPTION 'Tournament name is required';
  END IF;

  sport := COALESCE(payload #>> '{basics,sport}', 'Football');
  location := NULLIF(
    trim(
      COALESCE(payload #>> '{basics,city}', '') ||
      CASE
        WHEN (payload #>> '{basics,country}') IS NOT NULL AND (payload #>> '{basics,country}') <> ''
        THEN ', ' || (payload #>> '{basics,country}')
        ELSE ''
      END
    ),
    ''
  );
  start_date := NULLIF(payload #>> '{basics,startDate}', '')::date;
  end_date := NULLIF(payload #>> '{basics,endDate}', '')::date;
  logo_url := NULLIF(payload #>> '{basics,logoUrl}', '');
  cover_image_url := NULLIF(payload #>> '{basics,bannerUrl}', '');

  base_slug := public.slugify(tname);
  IF base_slug = '' THEN
    base_slug := 'tournament';
  END IF;

  final_slug := base_slug;
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.organization_id = org_id AND t.slug = final_slug
    );
    n := n + 1;
    final_slug := base_slug || '-' || (n + 1)::text;
  END LOOP;

  INSERT INTO public.tournaments (
    organization_id,
    name,
    slug,
    sport,
    location,
    status,
    start_date,
    end_date,
    cover_image_url,
    logo_url,
    is_featured,
    is_registration_open
  )
  VALUES (
    org_id,
    tname,
    final_slug,
    sport,
    location,
    'upcoming',
    start_date,
    end_date,
    cover_image_url,
    logo_url,
    false,
    true
  )
  RETURNING public.tournaments.id, public.tournaments.slug
  INTO id, slug;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_publish_tournament(jsonb) TO authenticated;

