-- Fix "record is not assigned yet" errors in knockout functions.

CREATE OR REPLACE FUNCTION public._knockout_resolve_source_team(
  p_tournament_id uuid,
  p_source text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  source_kind text;
  source_slot text;
  source_team_id uuid;
  rank_value int;
  group_id_value uuid;
  match_row record;
BEGIN
  IF p_source IS NULL OR trim(p_source) = '' THEN
    RETURN NULL;
  END IF;

  source_kind := split_part(p_source, ':', 1);
  source_slot := split_part(p_source, ':', 2);

  IF source_kind = 'team' THEN
    BEGIN
      source_team_id := source_slot::uuid;
    EXCEPTION WHEN others THEN
      RETURN NULL;
    END;
    RETURN source_team_id;
  END IF;

  IF source_kind = 'standing' THEN
    BEGIN
      rank_value := source_slot::int;
    EXCEPTION WHEN others THEN
      RETURN NULL;
    END;
    SELECT sc.team_id
    INTO source_team_id
    FROM public.standings_cache sc
    WHERE sc.tournament_id = p_tournament_id
      AND sc.group_id IS NULL
      AND sc.rank = rank_value
    LIMIT 1;
    RETURN source_team_id;
  END IF;

  IF source_kind = 'group' THEN
    BEGIN
      group_id_value := source_slot::uuid;
      rank_value := split_part(p_source, ':', 3)::int;
    EXCEPTION WHEN others THEN
      RETURN NULL;
    END;
    SELECT sc.team_id
    INTO source_team_id
    FROM public.standings_cache sc
    WHERE sc.tournament_id = p_tournament_id
      AND sc.group_id = group_id_value
      AND sc.rank = rank_value
    LIMIT 1;
    RETURN source_team_id;
  END IF;

  IF source_kind NOT IN ('winner', 'loser') OR source_slot = '' THEN
    RETURN NULL;
  END IF;

  SELECT
    mt.id,
    mt.home_team_id,
    mt.away_team_id,
    mt.home_score,
    mt.away_score,
    mt.status
  INTO match_row
  FROM public.matches mt
  WHERE mt.tournament_id = p_tournament_id
    AND mt.slot_code = source_slot
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF match_row.status NOT IN ('ft', 'completed') THEN
    RETURN NULL;
  END IF;

  IF COALESCE(match_row.home_score, 0) = COALESCE(match_row.away_score, 0) THEN
    RETURN NULL;
  END IF;

  IF source_kind = 'winner' THEN
    RETURN CASE
      WHEN COALESCE(match_row.home_score, 0) > COALESCE(match_row.away_score, 0)
        THEN match_row.home_team_id
      ELSE match_row.away_team_id
    END;
  END IF;

  RETURN CASE
    WHEN COALESCE(match_row.home_score, 0) > COALESCE(match_row.away_score, 0)
      THEN match_row.away_team_id
    ELSE match_row.home_team_id
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_fill_knockout_match_from_sources(
  p_match_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  match_row record;
  resolved_home uuid;
  resolved_away uuid;
BEGIN
  SELECT
    m.id,
    m.tournament_id,
    m.home_team_id,
    m.away_team_id,
    m.home_source,
    m.away_source,
    m.manual_home_override,
    m.manual_away_override
  INTO match_row
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(match_row.tournament_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  resolved_home := public._knockout_resolve_source_team(match_row.tournament_id, match_row.home_source);
  resolved_away := public._knockout_resolve_source_team(match_row.tournament_id, match_row.away_source);

  UPDATE public.matches
  SET
    home_team_id = CASE
      WHEN manual_home_override THEN home_team_id
      WHEN home_team_id IS NULL THEN resolved_home
      ELSE home_team_id
    END,
    away_team_id = CASE
      WHEN manual_away_override THEN away_team_id
      WHEN away_team_id IS NULL THEN resolved_away
      ELSE away_team_id
    END
  WHERE id = p_match_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;
