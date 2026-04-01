-- Extend knockout source resolver to support standings-based sources.
-- Supported source formats:
-- - standing:<rank>              (overall tournament standings)
-- - group:<group_id>:<rank>      (group standings via standings_cache.group_id)
-- Existing formats remain supported:
-- - team:<team_id>, winner:<slot>, loser:<slot>

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
  m record;
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
    m.id,
    m.home_team_id,
    m.away_team_id,
    m.home_score,
    m.away_score,
    m.status
  INTO m
  FROM public.matches m
  WHERE m.tournament_id = p_tournament_id
    AND m.slot_code = source_slot
  LIMIT 1;

  IF m.id IS NULL OR m.status NOT IN ('ft', 'completed') THEN
    RETURN NULL;
  END IF;

  IF COALESCE(m.home_score, 0) = COALESCE(m.away_score, 0) THEN
    RETURN NULL;
  END IF;

  IF source_kind = 'winner' THEN
    RETURN CASE WHEN COALESCE(m.home_score, 0) > COALESCE(m.away_score, 0) THEN m.home_team_id ELSE m.away_team_id END;
  END IF;
  RETURN CASE WHEN COALESCE(m.home_score, 0) > COALESCE(m.away_score, 0) THEN m.away_team_id ELSE m.home_team_id END;
END;
$$;
