-- Stable publish RPC with unambiguous variable names.
-- Use new function name to bypass older broken definitions in cache.

CREATE OR REPLACE FUNCTION public.rpc_publish_tournament_v2(payload jsonb)
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
  v_tournament_id uuid;
  v_slug text;
  category_record jsonb;
  format_record jsonb;
  category_db_id uuid;
  tournament_rule_cfg jsonb;
  category_rule_cfg jsonb;
  phase_rule_cfg jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT p.role INTO role FROM public.profiles p WHERE p.id = uid;
  IF role IS NULL OR role NOT IN ('organizer','admin','super_admin') THEN
    RAISE EXCEPTION 'Organizer access required';
  END IF;

  org_id := NULLIF(payload->>'organization_id', '')::uuid;
  IF org_id IS NULL THEN
    SELECT o.id INTO org_id FROM public.organizations o ORDER BY o.created_at ASC LIMIT 1;
  END IF;
  IF org_id IS NULL THEN RAISE EXCEPTION 'No organization available'; END IF;

  tname := COALESCE(payload #>> '{basics,tournamentName}', '');
  IF length(trim(tname)) < 3 THEN RAISE EXCEPTION 'Tournament name is required'; END IF;

  sport := COALESCE(payload #>> '{basics,sport}', 'Football');
  location := NULLIF(trim(COALESCE(payload #>> '{basics,city}', '') ||
    CASE
      WHEN (payload #>> '{basics,country}') IS NOT NULL AND (payload #>> '{basics,country}') <> ''
      THEN ', ' || (payload #>> '{basics,country}')
      ELSE '' END), '');
  start_date := NULLIF(payload #>> '{basics,startDate}', '')::date;
  end_date := NULLIF(payload #>> '{basics,endDate}', '')::date;
  logo_url := NULLIF(payload #>> '{basics,logoUrl}', '');
  cover_image_url := NULLIF(payload #>> '{basics,bannerUrl}', '');

  base_slug := public.slugify(tname);
  IF base_slug = '' THEN base_slug := 'tournament'; END IF;

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
    organization_id, name, slug, sport, location, status, start_date, end_date,
    cover_image_url, logo_url, is_featured, is_registration_open
  ) VALUES (
    org_id, tname, final_slug, sport, location, 'upcoming', start_date, end_date,
    cover_image_url, logo_url, false, true
  )
  RETURNING public.tournaments.id, public.tournaments.slug
  INTO v_tournament_id, v_slug;

  DELETE FROM public.tournament_format_rules WHERE tournament_id = v_tournament_id;
  DELETE FROM public.tournament_categories WHERE tournament_id = v_tournament_id;

  IF payload ? 'categories' THEN
    FOR category_record IN
      SELECT value FROM jsonb_array_elements(COALESCE(payload->'categories', '[]'::jsonb))
    LOOP
      INSERT INTO public.tournament_categories (
        tournament_id, source_category_id, name, short_label, gender_group, age_group,
        max_teams, min_teams, roster_min, roster_max, match_duration_minutes, visibility, sort_order
      ) VALUES (
        v_tournament_id,
        NULLIF(category_record->>'id', ''),
        NULLIF(category_record->>'name', ''),
        NULLIF(category_record->>'shortLabel', ''),
        NULLIF(category_record->>'genderGroup', ''),
        NULLIF(category_record->>'ageGroup', ''),
        COALESCE(NULLIF(category_record->>'maxTeams', '')::int, 0),
        COALESCE(NULLIF(category_record->>'minTeams', '')::int, 0),
        COALESCE(NULLIF(category_record->>'rosterMin', '')::int, 0),
        COALESCE(NULLIF(category_record->>'rosterMax', '')::int, 0),
        COALESCE(NULLIF(category_record->>'matchDurationMinutes', '')::int, 0),
        COALESCE(NULLIF(category_record->>'visibility', ''), 'public'),
        COALESCE(NULLIF(category_record->>'sortOrder', '')::int, 0)
      );
    END LOOP;
  END IF;

  IF payload ? 'format_rules' THEN
    FOR format_record IN
      SELECT value FROM jsonb_array_elements(COALESCE(payload->'format_rules', '[]'::jsonb))
    LOOP
      SELECT tc.id INTO category_db_id
      FROM public.tournament_categories tc
      WHERE tc.tournament_id = v_tournament_id
        AND tc.source_category_id = format_record->>'categoryId'
      LIMIT 1;
      IF category_db_id IS NULL THEN CONTINUE; END IF;

      INSERT INTO public.tournament_format_rules (
        tournament_id, category_id, format_type, group_count, teams_advance_per_group,
        include_best_runners_up, knockout_round, round_robin_legs, third_place_match,
        tiebreak_order, auto_generate_fixtures, match_duration_minutes, break_duration_minutes,
        preferred_start_time, preferred_end_time, max_matches_per_day_per_team, min_rest_minutes_between_matches
      ) VALUES (
        v_tournament_id, category_db_id,
        COALESCE(NULLIF(format_record->>'formatType', ''), 'round_robin'),
        COALESCE(NULLIF(format_record->>'groupCount', '')::int, 0),
        COALESCE(NULLIF(format_record->>'teamsAdvancePerGroup', '')::int, 0),
        COALESCE(NULLIF(format_record->>'includeBestRunnersUp', '')::int, 0),
        NULLIF(format_record->>'knockoutRound', ''),
        COALESCE(NULLIF(format_record->>'roundRobinLegs', '')::int, 0),
        COALESCE((format_record->>'thirdPlaceMatch')::boolean, false),
        format_record->'tiebreakOrder',
        COALESCE((format_record->>'autoGenerateFixtures')::boolean, true),
        COALESCE(NULLIF(format_record->>'matchDurationMinutes', '')::int, 0),
        COALESCE(NULLIF(format_record->>'breakDurationMinutes', '')::int, 0),
        NULLIF(format_record->>'preferredStartTime', ''),
        NULLIF(format_record->>'preferredEndTime', ''),
        COALESCE(NULLIF(format_record->>'maxMatchesPerDayPerTeam', '')::int, 0),
        COALESCE(NULLIF(format_record->>'minRestMinutesBetweenMatches', '')::int, 0)
      );
    END LOOP;
  END IF;

  tournament_rule_cfg := COALESCE(payload->'tournament_rule_config', '{}'::jsonb);
  IF tournament_rule_cfg <> '{}'::jsonb THEN
    PERFORM public.rpc_set_tournament_rule_config(
      v_tournament_id,
      COALESCE(tournament_rule_cfg->>'sport', sport),
      COALESCE(tournament_rule_cfg->'rule_config', '{}'::jsonb),
      COALESCE(tournament_rule_cfg->>'source', 'organizer_wizard')
    );
  ELSE
    PERFORM public.rpc_set_tournament_rule_config(
      v_tournament_id,
      sport,
      COALESCE((public.rpc_get_sport_rule_template(sport))->'rule_config', '{}'::jsonb),
      'sport_default_auto'
    );
  END IF;

  IF payload ? 'category_rule_configs' THEN
    FOR category_rule_cfg IN
      SELECT value FROM jsonb_array_elements(COALESCE(payload->'category_rule_configs', '[]'::jsonb))
    LOOP
      SELECT tc.id INTO category_db_id
      FROM public.tournament_categories tc
      WHERE tc.tournament_id = v_tournament_id
        AND tc.source_category_id = category_rule_cfg->>'categoryId'
      LIMIT 1;
      IF category_db_id IS NULL THEN CONTINUE; END IF;
      PERFORM public.rpc_set_category_rule_config(
        v_tournament_id,
        category_db_id,
        COALESCE(category_rule_cfg->'rule_config', '{}'::jsonb)
      );
    END LOOP;
  END IF;

  IF payload ? 'phase_rule_configs' THEN
    FOR phase_rule_cfg IN
      SELECT value FROM jsonb_array_elements(COALESCE(payload->'phase_rule_configs', '[]'::jsonb))
    LOOP
      PERFORM public.rpc_set_phase_rule_config(
        v_tournament_id,
        COALESCE(phase_rule_cfg->>'phaseKey', 'default'),
        COALESCE(phase_rule_cfg->'rule_config', '{}'::jsonb)
      );
    END LOOP;
  END IF;

  RETURN QUERY SELECT v_tournament_id, v_slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_publish_tournament_v2(jsonb) TO authenticated;
