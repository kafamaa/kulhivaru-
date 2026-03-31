-- Sport rules presets + tournament/category/phase rule configs
-- RPC-only write path for organizer match management and rule-aware events.

CREATE TABLE IF NOT EXISTS public.sport_rule_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport text NOT NULL UNIQUE,
  display_name text NOT NULL,
  version int NOT NULL DEFAULT 1,
  rule_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tournament_rule_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  sport text NOT NULL,
  source text NOT NULL DEFAULT 'organizer_wizard',
  template_version int,
  rule_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id)
);

CREATE TABLE IF NOT EXISTS public.category_rule_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.tournament_categories(id) ON DELETE CASCADE,
  rule_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.phase_rule_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  phase_key text NOT NULL,
  rule_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, phase_key)
);

CREATE INDEX IF NOT EXISTS idx_tournament_rule_configs_tournament
  ON public.tournament_rule_configs (tournament_id);

CREATE INDEX IF NOT EXISTS idx_category_rule_configs_tournament
  ON public.category_rule_configs (tournament_id);

CREATE INDEX IF NOT EXISTS idx_phase_rule_configs_tournament
  ON public.phase_rule_configs (tournament_id);

ALTER TABLE public.sport_rule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_rule_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_rule_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_rule_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sport_rule_templates_read_authenticated" ON public.sport_rule_templates;
CREATE POLICY "sport_rule_templates_read_authenticated"
  ON public.sport_rule_templates
  FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "tournament_rule_configs_read_authenticated" ON public.tournament_rule_configs;
CREATE POLICY "tournament_rule_configs_read_authenticated"
  ON public.tournament_rule_configs
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "category_rule_configs_read_authenticated" ON public.category_rule_configs;
CREATE POLICY "category_rule_configs_read_authenticated"
  ON public.category_rule_configs
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "phase_rule_configs_read_authenticated" ON public.phase_rule_configs;
CREATE POLICY "phase_rule_configs_read_authenticated"
  ON public.phase_rule_configs
  FOR SELECT TO authenticated
  USING (true);

-- Match events: extend shape for team fouls by half and rule metadata.
ALTER TABLE public.match_events
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE public.match_events
  ADD COLUMN IF NOT EXISTS period_index int;

ALTER TABLE public.match_events
  ADD COLUMN IF NOT EXISTS event_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.match_events
  DROP CONSTRAINT IF EXISTS match_events_event_type_check;

ALTER TABLE public.match_events
  ADD CONSTRAINT match_events_event_type_check
  CHECK (
    event_type IN (
      'goal',
      'assist',
      'yellow_card',
      'red_card',
      'sub_in',
      'sub_out',
      'team_foul',
      'penalty_free_kick'
    )
  );

-- Remove broad direct-write table policies and force RPC path.
DROP POLICY IF EXISTS "Allow authenticated insert matches" ON public.matches;
DROP POLICY IF EXISTS "Allow authenticated update matches" ON public.matches;
DROP POLICY IF EXISTS "Allow authenticated delete matches" ON public.matches;
DROP POLICY IF EXISTS "Allow authenticated insert match_events" ON public.match_events;
DROP POLICY IF EXISTS "Allow authenticated update match_events" ON public.match_events;
DROP POLICY IF EXISTS "Allow authenticated delete match_events" ON public.match_events;

-- Utility access checker used by RPCs.
CREATE OR REPLACE FUNCTION public.rpc_can_manage_tournament(p_tournament_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  user_role text;
  can_manage boolean;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT p.role INTO user_role
  FROM public.profiles p
  WHERE p.id = uid;

  IF user_role IN ('admin', 'super_admin') THEN
    RETURN true;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.tournaments t
    JOIN public.organizations o ON o.id = t.organization_id
    LEFT JOIN public.organization_members om
      ON om.organization_id = o.id
      AND om.profile_id = uid
      AND COALESCE(om.status, '') IN ('active', 'approved')
    WHERE t.id = p_tournament_id
      AND (
        o.owner_id = uid
        OR om.profile_id IS NOT NULL
      )
  ) INTO can_manage;

  RETURN COALESCE(can_manage, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_can_manage_tournament(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_get_sport_rule_template(p_sport text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
BEGIN
  SELECT jsonb_build_object(
    'sport', srt.sport,
    'display_name', srt.display_name,
    'version', srt.version,
    'rule_config', srt.rule_config
  )
  INTO payload
  FROM public.sport_rule_templates srt
  WHERE lower(srt.sport) = lower(COALESCE(p_sport, ''))
    AND srt.is_active = true
  LIMIT 1;

  IF payload IS NULL THEN
    SELECT jsonb_build_object(
      'sport', srt.sport,
      'display_name', srt.display_name,
      'version', srt.version,
      'rule_config', srt.rule_config
    )
    INTO payload
    FROM public.sport_rule_templates srt
    WHERE lower(srt.sport) = 'football'
      AND srt.is_active = true
    LIMIT 1;
  END IF;

  RETURN COALESCE(payload, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_sport_rule_template(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_set_tournament_rule_config(
  p_tournament_id uuid,
  p_sport text,
  p_rule_config jsonb,
  p_source text DEFAULT 'organizer_wizard'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  template_version int;
  upserted_id uuid;
BEGIN
  IF NOT public.rpc_can_manage_tournament(p_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to manage tournament rules';
  END IF;

  uid := auth.uid();

  SELECT srt.version INTO template_version
  FROM public.sport_rule_templates srt
  WHERE lower(srt.sport) = lower(COALESCE(p_sport, ''))
    AND srt.is_active = true
  LIMIT 1;

  INSERT INTO public.tournament_rule_configs (
    tournament_id,
    sport,
    source,
    template_version,
    rule_config,
    created_by,
    updated_by
  ) VALUES (
    p_tournament_id,
    COALESCE(NULLIF(p_sport, ''), 'Football'),
    COALESCE(NULLIF(p_source, ''), 'organizer_wizard'),
    template_version,
    COALESCE(p_rule_config, '{}'::jsonb),
    uid,
    uid
  )
  ON CONFLICT (tournament_id) DO UPDATE SET
    sport = EXCLUDED.sport,
    source = EXCLUDED.source,
    template_version = EXCLUDED.template_version,
    rule_config = EXCLUDED.rule_config,
    updated_by = uid,
    updated_at = now()
  RETURNING id INTO upserted_id;

  RETURN jsonb_build_object('ok', true, 'id', upserted_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_set_tournament_rule_config(uuid, text, jsonb, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_set_category_rule_config(
  p_tournament_id uuid,
  p_category_id uuid,
  p_rule_config jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  upserted_id uuid;
BEGIN
  IF NOT public.rpc_can_manage_tournament(p_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to manage category rules';
  END IF;

  uid := auth.uid();

  INSERT INTO public.category_rule_configs (
    tournament_id,
    category_id,
    rule_config,
    created_by,
    updated_by
  ) VALUES (
    p_tournament_id,
    p_category_id,
    COALESCE(p_rule_config, '{}'::jsonb),
    uid,
    uid
  )
  ON CONFLICT (tournament_id, category_id) DO UPDATE SET
    rule_config = EXCLUDED.rule_config,
    updated_by = uid,
    updated_at = now()
  RETURNING id INTO upserted_id;

  RETURN jsonb_build_object('ok', true, 'id', upserted_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_set_category_rule_config(uuid, uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_set_phase_rule_config(
  p_tournament_id uuid,
  p_phase_key text,
  p_rule_config jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  upserted_id uuid;
BEGIN
  IF NOT public.rpc_can_manage_tournament(p_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to manage phase rules';
  END IF;

  uid := auth.uid();

  INSERT INTO public.phase_rule_configs (
    tournament_id,
    phase_key,
    rule_config,
    created_by,
    updated_by
  ) VALUES (
    p_tournament_id,
    COALESCE(NULLIF(p_phase_key, ''), 'default'),
    COALESCE(p_rule_config, '{}'::jsonb),
    uid,
    uid
  )
  ON CONFLICT (tournament_id, phase_key) DO UPDATE SET
    rule_config = EXCLUDED.rule_config,
    updated_by = uid,
    updated_at = now()
  RETURNING id INTO upserted_id;

  RETURN jsonb_build_object('ok', true, 'id', upserted_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_set_phase_rule_config(uuid, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_reset_tournament_rule_config_to_sport_default(
  p_tournament_id uuid,
  p_sport text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tmpl jsonb;
BEGIN
  tmpl := public.rpc_get_sport_rule_template(p_sport);
  IF tmpl = '{}'::jsonb THEN
    RAISE EXCEPTION 'No sport rule template found';
  END IF;

  RETURN public.rpc_set_tournament_rule_config(
    p_tournament_id,
    COALESCE(tmpl->>'sport', p_sport),
    COALESCE(tmpl->'rule_config', '{}'::jsonb),
    'sport_default_reset'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_reset_tournament_rule_config_to_sport_default(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_add_match_event_rule_aware(
  p_match_id uuid,
  p_event_type text,
  p_player_id uuid DEFAULT NULL,
  p_team_id uuid DEFAULT NULL,
  p_minute int DEFAULT NULL,
  p_period_index int DEFAULT NULL,
  p_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  match_tournament_id uuid;
  match_sport text;
  rule_cfg jsonb;
  foul_limit int;
  add_penalty boolean;
  current_foul_count int;
  inserted_event_id uuid;
  penalty_event_id uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT m.tournament_id, COALESCE(t.sport, 'Football')
  INTO match_tournament_id, match_sport
  FROM public.matches m
  JOIN public.tournaments t ON t.id = m.tournament_id
  WHERE m.id = p_match_id;

  IF match_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(match_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to manage this match';
  END IF;

  INSERT INTO public.match_events (
    match_id,
    player_id,
    team_id,
    event_type,
    minute,
    period_index,
    event_meta
  ) VALUES (
    p_match_id,
    p_player_id,
    p_team_id,
    p_event_type,
    p_minute,
    p_period_index,
    COALESCE(p_meta, '{}'::jsonb)
  )
  RETURNING id INTO inserted_event_id;

  -- Futsal threshold rule: if team fouls exceed configured half limit, emit penalty/free-kick event.
  IF lower(match_sport) = 'futsal' AND p_event_type = 'team_foul' THEN
    SELECT trc.rule_config INTO rule_cfg
    FROM public.tournament_rule_configs trc
    WHERE trc.tournament_id = match_tournament_id
    LIMIT 1;

    foul_limit := COALESCE((rule_cfg->>'team_foul_limit_per_half')::int, 5);
    add_penalty := COALESCE((rule_cfg->>'penalty_after_foul_limit')::boolean, true);

    SELECT COUNT(*)::int INTO current_foul_count
    FROM public.match_events me
    WHERE me.match_id = p_match_id
      AND me.event_type = 'team_foul'
      AND COALESCE(me.period_index, 1) = COALESCE(p_period_index, 1)
      AND COALESCE(me.team_id::text, '') = COALESCE(p_team_id::text, '');

    IF add_penalty AND current_foul_count > foul_limit THEN
      INSERT INTO public.match_events (
        match_id,
        player_id,
        team_id,
        event_type,
        minute,
        period_index,
        event_meta
      ) VALUES (
        p_match_id,
        NULL,
        p_team_id,
        'penalty_free_kick',
        p_minute,
        p_period_index,
        jsonb_build_object(
          'triggered_by', 'team_foul_limit',
          'foul_count', current_foul_count,
          'foul_limit', foul_limit
        )
      )
      RETURNING id INTO penalty_event_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'event_id', inserted_event_id,
    'auto_penalty_event_id', penalty_event_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_add_match_event_rule_aware(uuid, text, uuid, uuid, int, int, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_remove_match_event_rule_aware(
  p_match_id uuid,
  p_event_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match_tournament_id uuid;
BEGIN
  SELECT m.tournament_id INTO match_tournament_id
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF match_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(match_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to manage this match';
  END IF;

  DELETE FROM public.match_events
  WHERE id = p_event_id
    AND match_id = p_match_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_remove_match_event_rule_aware(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_update_match_live_score(
  p_match_id uuid,
  p_home_score int,
  p_away_score int,
  p_live_minute int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match_tournament_id uuid;
BEGIN
  SELECT m.tournament_id INTO match_tournament_id
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF match_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(match_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to update this match';
  END IF;

  UPDATE public.matches
  SET
    status = 'live',
    home_score = COALESCE(p_home_score, 0),
    away_score = COALESCE(p_away_score, 0),
    live_minute = p_live_minute
  WHERE id = p_match_id;

  RETURN jsonb_build_object('ok', true, 'tournament_id', match_tournament_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_match_live_score(uuid, int, int, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_finalize_match_rule_aware(
  p_match_id uuid,
  p_home_score int,
  p_away_score int,
  p_status text DEFAULT 'ft'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match_tournament_id uuid;
  normalized_status text;
  recompute_result record;
BEGIN
  SELECT m.tournament_id INTO match_tournament_id
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF match_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(match_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to finalize this match';
  END IF;

  normalized_status := CASE
    WHEN p_status IN ('ft', 'completed') THEN p_status
    ELSE 'ft'
  END;

  UPDATE public.matches
  SET
    home_score = COALESCE(p_home_score, 0),
    away_score = COALESCE(p_away_score, 0),
    status = normalized_status
  WHERE id = p_match_id;

  SELECT * INTO recompute_result
  FROM public.rpc_recompute_standings_cache(match_tournament_id)
  LIMIT 1;

  RETURN jsonb_build_object(
    'ok', true,
    'tournament_id', match_tournament_id,
    'rows_upserted', COALESCE(recompute_result.rows_upserted, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_finalize_match_rule_aware(uuid, int, int, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_update_match_schedule(
  p_match_id uuid,
  p_scheduled_at timestamptz,
  p_round_label text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match_tournament_id uuid;
BEGIN
  SELECT m.tournament_id INTO match_tournament_id
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF match_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(match_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to schedule this match';
  END IF;

  UPDATE public.matches
  SET
    scheduled_at = p_scheduled_at,
    round_label = p_round_label
  WHERE id = p_match_id;

  RETURN jsonb_build_object('ok', true, 'tournament_id', match_tournament_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_match_schedule(uuid, timestamptz, text) TO authenticated;

-- Extend publish RPC to persist tournament/category/phase rule configs.
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
  category_record jsonb;
  format_record jsonb;
  category_db_id uuid;
  tournament_rule_cfg jsonb;
  category_rule_cfg jsonb;
  phase_rule_cfg jsonb;
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

  DELETE FROM public.tournament_format_rules WHERE tournament_id = id;
  DELETE FROM public.tournament_categories WHERE tournament_id = id;

  IF payload ? 'categories' THEN
    FOR category_record IN
      SELECT value FROM jsonb_array_elements(COALESCE(payload->'categories', '[]'::jsonb))
    LOOP
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
        id,
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
        NULLIF(category_record->>'visibility', 'public'),
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
      WHERE tc.tournament_id = id
        AND tc.source_category_id = format_record->>'categoryId'
      LIMIT 1;

      IF category_db_id IS NULL THEN
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
        id,
        category_db_id,
        NULLIF(format_record->>'formatType', 'round_robin'),
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
      id,
      COALESCE(tournament_rule_cfg->>'sport', sport),
      COALESCE(tournament_rule_cfg->'rule_config', '{}'::jsonb),
      COALESCE(tournament_rule_cfg->>'source', 'organizer_wizard')
    );
  ELSE
    PERFORM public.rpc_set_tournament_rule_config(
      id,
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
      WHERE tc.tournament_id = id
        AND tc.source_category_id = category_rule_cfg->>'categoryId'
      LIMIT 1;

      IF category_db_id IS NULL THEN
        CONTINUE;
      END IF;

      PERFORM public.rpc_set_category_rule_config(
        id,
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
        id,
        COALESCE(phase_rule_cfg->>'phaseKey', 'default'),
        COALESCE(phase_rule_cfg->'rule_config', '{}'::jsonb)
      );
    END LOOP;
  END IF;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_publish_tournament(jsonb) TO authenticated;

-- Seed templates.
INSERT INTO public.sport_rule_templates (sport, display_name, version, rule_config, is_active)
VALUES
  (
    'Football',
    'Football',
    1,
    jsonb_build_object(
      'match_format', jsonb_build_object('players_on_court', 11, 'halves', 2, 'half_duration_minutes', 45),
      'scoring_model', jsonb_build_object('goal_points', 1),
      'foul_card_model', jsonb_build_object('yellow_red_cards_enabled', true),
      'overtime_rules', jsonb_build_object('extra_time_enabled', true, 'extra_time_halves', 2, 'extra_time_half_minutes', 15),
      'penalty_shootout_rules', jsonb_build_object('penalties_enabled', true, 'initial_kicks', 5),
      'player_limits', jsonb_build_object('squad_max', 23),
      'substitution_rules', jsonb_build_object('max_substitutions', 5, 'rolling_substitutions', false),
      'standings_tiebreak', jsonb_build_object('win_points', 3, 'draw_points', 1, 'loss_points', 0),
      'event_types', jsonb_build_array('goal', 'assist', 'yellow_card', 'red_card', 'sub_in', 'sub_out')
    ),
    true
  ),
  (
    'Futsal',
    'Futsal',
    1,
    jsonb_build_object(
      'players_on_court', 5,
      'halves', 2,
      'half_duration_minutes', 20,
      'rolling_substitutions', true,
      'yellow_red_cards_enabled', true,
      'team_foul_limit_per_half', 5,
      'penalty_after_foul_limit', true,
      'reset_fouls_each_half', true,
      'extra_time_enabled', false,
      'penalties_enabled', true,
      'scoring_model', jsonb_build_object('goal_points', 1),
      'standings_tiebreak', jsonb_build_object('win_points', 3, 'draw_points', 1, 'loss_points', 0),
      'event_types', jsonb_build_array(
        'goal',
        'assist',
        'yellow_card',
        'red_card',
        'sub_in',
        'sub_out',
        'team_foul',
        'penalty_free_kick'
      )
    ),
    true
  ),
  (
    'Basketball',
    'Basketball',
    1,
    jsonb_build_object(
      'match_format', jsonb_build_object('players_on_court', 5, 'periods', 4, 'period_duration_minutes', 10),
      'scoring_model', jsonb_build_object('two_point', 2, 'three_point', 3, 'free_throw', 1),
      'foul_card_model', jsonb_build_object('player_foul_out_limit', 5, 'team_foul_limit_per_period', 5),
      'overtime_rules', jsonb_build_object('overtime_enabled', true, 'overtime_minutes', 5),
      'player_limits', jsonb_build_object('squad_max', 12),
      'substitution_rules', jsonb_build_object('rolling_substitutions', true),
      'event_types', jsonb_build_array('goal', 'assist', 'sub_in', 'sub_out')
    ),
    true
  ),
  (
    'Volleyball',
    'Volleyball',
    1,
    jsonb_build_object(
      'match_format', jsonb_build_object('players_on_court', 6, 'sets_to_win', 3, 'best_of_sets', 5),
      'scoring_model', jsonb_build_object('rally_point', true, 'set_points', 25, 'deciding_set_points', 15),
      'substitution_rules', jsonb_build_object('max_substitutions_per_set', 6),
      'event_types', jsonb_build_array('sub_in', 'sub_out')
    ),
    true
  ),
  (
    'Badminton',
    'Badminton',
    1,
    jsonb_build_object(
      'match_format', jsonb_build_object('games_to_win', 2, 'best_of_games', 3),
      'scoring_model', jsonb_build_object('rally_point', true, 'points_per_game', 21),
      'overtime_rules', jsonb_build_object('win_by_two_until', 30),
      'event_types', jsonb_build_array('sub_in', 'sub_out')
    ),
    true
  )
ON CONFLICT (sport) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  version = EXCLUDED.version,
  rule_config = EXCLUDED.rule_config,
  is_active = EXCLUDED.is_active,
  updated_at = now();
