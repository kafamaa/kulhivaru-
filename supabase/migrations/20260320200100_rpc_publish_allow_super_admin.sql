-- Allow super_admin to publish tournaments (same as organizer/admin).

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

  tournament_id uuid;

  cat jsonb;
  fr jsonb;
  cat_db_id uuid;
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

  org_id := NULLIF(payload->>'organization_id', '')::uuid;
  IF org_id IS NULL THEN
    SELECT o.id INTO org_id
    FROM public.organizations o
    ORDER BY o.created_at ASC
    LIMIT 1;
  END IF;
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'No organization available';
  END IF;

  tname := COALESCE(payload #>> '{basics,tournamentName}', '');
  IF length(trim(tname)) < 3 THEN
    RAISE EXCEPTION 'Tournament name is required';
  END IF;

  sport := COALESCE(payload #>> '{basics,sport}', 'Football');
  location := NULLIF(trim(COALESCE(payload #>> '{basics,city}', '') ||
    CASE
      WHEN (payload #>> '{basics,country}') IS NOT NULL AND (payload #>> '{basics,country}') <> '' THEN
        ', ' || (payload #>> '{basics,country}')
      ELSE '' END), '');

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
  INTO tournament_id, slug;

  id := tournament_id;

  DELETE FROM public.tournament_format_rules WHERE tournament_id = tournament_id;
  DELETE FROM public.tournament_categories WHERE tournament_id = tournament_id;

  IF payload ? 'categories' THEN
    FOR cat IN SELECT value FROM jsonb_array_elements(COALESCE(payload->'categories','[]'::jsonb)) LOOP
      INSERT INTO public.tournament_categories (
        tournament_id,
        source_category_id,
        name,
        short_label,
        gender_group,
        age_group,
        max_teams,
        min_teams,
        roster_min,
        roster_max,
        match_duration_minutes,
        visibility,
        sort_order
      ) VALUES (
        tournament_id,
        NULLIF(cat->>'id',''),
        NULLIF(cat->>'name',''),
        NULLIF(cat->>'shortLabel',''),
        NULLIF(cat->>'genderGroup',''),
        NULLIF(cat->>'ageGroup',''),
        COALESCE(NULLIF(cat->>'maxTeams','')::int, 0),
        COALESCE(NULLIF(cat->>'minTeams','')::int, 0),
        COALESCE(NULLIF(cat->>'rosterMin','')::int, 0),
        COALESCE(NULLIF(cat->>'rosterMax','')::int, 0),
        COALESCE(NULLIF(cat->>'matchDurationMinutes','')::int, 0),
        NULLIF(cat->>'visibility','public'),
        COALESCE(NULLIF(cat->>'sortOrder','')::int, 0)
      );
    END LOOP;
  END IF;

  IF payload ? 'format_rules' THEN
    FOR fr IN SELECT value FROM jsonb_array_elements(COALESCE(payload->'format_rules','[]'::jsonb)) LOOP
      SELECT tc.id INTO cat_db_id
      FROM public.tournament_categories tc
      WHERE tc.tournament_id = tournament_id
        AND tc.source_category_id = fr->>'categoryId'
      LIMIT 1;

      IF cat_db_id IS NULL THEN
        CONTINUE;
      END IF;

      INSERT INTO public.tournament_format_rules (
        tournament_id,
        category_id,
        format_type,
        group_count,
        teams_advance_per_group,
        include_best_runners_up,
        knockout_round,
        round_robin_legs,
        third_place_match,
        tiebreak_order,
        auto_generate_fixtures,
        match_duration_minutes,
        break_duration_minutes,
        preferred_start_time,
        preferred_end_time,
        max_matches_per_day_per_team,
        min_rest_minutes_between_matches
      ) VALUES (
        tournament_id,
        cat_db_id,
        NULLIF(fr->>'formatType','round_robin'),
        COALESCE(NULLIF(fr->>'groupCount','')::int, 0),
        COALESCE(NULLIF(fr->>'teamsAdvancePerGroup','')::int, 0),
        COALESCE(NULLIF(fr->>'includeBestRunnersUp','')::int, 0),
        NULLIF(fr->>'knockoutRound',''),
        COALESCE(NULLIF(fr->>'roundRobinLegs','')::int, 0),
        COALESCE((fr->>'thirdPlaceMatch')::boolean, false),
        fr->'tiebreakOrder',
        COALESCE((fr->>'autoGenerateFixtures')::boolean, true),
        COALESCE(NULLIF(fr->>'matchDurationMinutes','')::int, 0),
        COALESCE(NULLIF(fr->>'breakDurationMinutes','')::int, 0),
        NULLIF(fr->>'preferredStartTime',''),
        NULLIF(fr->>'preferredEndTime',''),
        COALESCE(NULLIF(fr->>'maxMatchesPerDayPerTeam','')::int, 0),
        COALESCE(NULLIF(fr->>'minRestMinutesBetweenMatches','')::int, 0)
      );
    END LOOP;
  END IF;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_publish_tournament(jsonb) TO authenticated;
