-- Hybrid knockout progression foundation (auto + manual override)

ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS knockout_progression_mode text NOT NULL DEFAULT 'hybrid'
CHECK (knockout_progression_mode IN ('auto', 'manual', 'hybrid'));

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS slot_code text,
ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manual'
  CHECK (source_type IN ('manual', 'auto')),
ADD COLUMN IF NOT EXISTS home_source text,
ADD COLUMN IF NOT EXISTS away_source text,
ADD COLUMN IF NOT EXISTS manual_home_override boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS manual_away_override boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS venue text,
ADD COLUMN IF NOT EXISTS notes text;

CREATE UNIQUE INDEX IF NOT EXISTS matches_tournament_slot_code_uniq
ON public.matches(tournament_id, slot_code)
WHERE slot_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public._knockout_round_label_from_slot(p_slot text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_slot IS NULL THEN
    RETURN NULL;
  END IF;
  IF p_slot LIKE 'QF%' THEN RETURN 'Quarter Final'; END IF;
  IF p_slot LIKE 'SF%' THEN RETURN 'Semi Final'; END IF;
  IF p_slot LIKE 'F%' THEN RETURN 'Final'; END IF;
  IF p_slot LIKE 'TP%' THEN RETURN 'Third Place'; END IF;
  RETURN p_slot;
END;
$$;

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

  -- Do not auto-resolve on draw.
  IF COALESCE(m.home_score, 0) = COALESCE(m.away_score, 0) THEN
    RETURN NULL;
  END IF;

  IF source_kind = 'winner' THEN
    RETURN CASE WHEN COALESCE(m.home_score, 0) > COALESCE(m.away_score, 0) THEN m.home_team_id ELSE m.away_team_id END;
  END IF;
  RETURN CASE WHEN COALESCE(m.home_score, 0) > COALESCE(m.away_score, 0) THEN m.away_team_id ELSE m.home_team_id END;
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
  m record;
  resolved_home uuid;
  resolved_away uuid;
BEGIN
  SELECT
    id,
    tournament_id,
    home_team_id,
    away_team_id,
    home_source,
    away_source,
    manual_home_override,
    manual_away_override
  INTO m
  FROM public.matches
  WHERE id = p_match_id;

  IF m.id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(m.tournament_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  resolved_home := public._knockout_resolve_source_team(m.tournament_id, m.home_source);
  resolved_away := public._knockout_resolve_source_team(m.tournament_id, m.away_source);

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

GRANT EXECUTE ON FUNCTION public.rpc_fill_knockout_match_from_sources(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_create_manual_knockout_match(
  p_tournament_id uuid,
  p_slot_code text,
  p_home_team_id uuid DEFAULT NULL,
  p_away_team_id uuid DEFAULT NULL,
  p_scheduled_at timestamptz DEFAULT NULL,
  p_venue text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_home_source text DEFAULT NULL,
  p_away_source text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_match_id uuid;
  normalized_slot text;
BEGIN
  IF NOT public.rpc_can_manage_tournament(p_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to manage this tournament';
  END IF;

  normalized_slot := upper(trim(COALESCE(p_slot_code, '')));
  IF normalized_slot = '' THEN
    RAISE EXCEPTION 'slot_code is required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.tournament_id = p_tournament_id
      AND m.slot_code = normalized_slot
  ) THEN
    RAISE EXCEPTION 'Match slot % already exists', normalized_slot;
  END IF;

  IF p_home_team_id IS NOT NULL AND p_away_team_id IS NOT NULL AND p_home_team_id = p_away_team_id THEN
    RAISE EXCEPTION 'Home and away teams must be different';
  END IF;

  INSERT INTO public.matches (
    tournament_id,
    home_team_id,
    away_team_id,
    status,
    round_label,
    scheduled_at,
    home_score,
    away_score,
    slot_code,
    source_type,
    home_source,
    away_source,
    manual_home_override,
    manual_away_override,
    venue,
    notes
  )
  VALUES (
    p_tournament_id,
    p_home_team_id,
    p_away_team_id,
    'scheduled',
    public._knockout_round_label_from_slot(normalized_slot),
    p_scheduled_at,
    0,
    0,
    normalized_slot,
    'manual',
    NULLIF(p_home_source, ''),
    NULLIF(p_away_source, ''),
    p_home_team_id IS NOT NULL,
    p_away_team_id IS NOT NULL,
    NULLIF(p_venue, ''),
    NULLIF(p_notes, '')
  )
  RETURNING id INTO new_match_id;

  PERFORM public.rpc_fill_knockout_match_from_sources(new_match_id);
  RETURN jsonb_build_object('ok', true, 'match_id', new_match_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_create_manual_knockout_match(uuid, text, uuid, uuid, timestamptz, text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_generate_next_knockout_round(
  p_tournament_id uuid,
  p_include_third_place boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  created_count int := 0;
BEGIN
  IF NOT public.rpc_can_manage_tournament(p_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to manage this tournament';
  END IF;

  -- SF1 from QF1,QF2
  IF NOT EXISTS (SELECT 1 FROM public.matches WHERE tournament_id = p_tournament_id AND slot_code = 'SF1')
     AND public._knockout_resolve_source_team(p_tournament_id, 'winner:QF1') IS NOT NULL
     AND public._knockout_resolve_source_team(p_tournament_id, 'winner:QF2') IS NOT NULL THEN
    INSERT INTO public.matches (
      tournament_id, home_team_id, away_team_id, status, round_label, home_score, away_score,
      slot_code, source_type, home_source, away_source
    ) VALUES (
      p_tournament_id,
      public._knockout_resolve_source_team(p_tournament_id, 'winner:QF1'),
      public._knockout_resolve_source_team(p_tournament_id, 'winner:QF2'),
      'scheduled', 'Semi Final', 0, 0,
      'SF1', 'auto', 'winner:QF1', 'winner:QF2'
    );
    created_count := created_count + 1;
  END IF;

  -- SF2 from QF3,QF4
  IF NOT EXISTS (SELECT 1 FROM public.matches WHERE tournament_id = p_tournament_id AND slot_code = 'SF2')
     AND public._knockout_resolve_source_team(p_tournament_id, 'winner:QF3') IS NOT NULL
     AND public._knockout_resolve_source_team(p_tournament_id, 'winner:QF4') IS NOT NULL THEN
    INSERT INTO public.matches (
      tournament_id, home_team_id, away_team_id, status, round_label, home_score, away_score,
      slot_code, source_type, home_source, away_source
    ) VALUES (
      p_tournament_id,
      public._knockout_resolve_source_team(p_tournament_id, 'winner:QF3'),
      public._knockout_resolve_source_team(p_tournament_id, 'winner:QF4'),
      'scheduled', 'Semi Final', 0, 0,
      'SF2', 'auto', 'winner:QF3', 'winner:QF4'
    );
    created_count := created_count + 1;
  END IF;

  -- Final from SF1,SF2
  IF NOT EXISTS (SELECT 1 FROM public.matches WHERE tournament_id = p_tournament_id AND slot_code = 'F1')
     AND public._knockout_resolve_source_team(p_tournament_id, 'winner:SF1') IS NOT NULL
     AND public._knockout_resolve_source_team(p_tournament_id, 'winner:SF2') IS NOT NULL THEN
    INSERT INTO public.matches (
      tournament_id, home_team_id, away_team_id, status, round_label, home_score, away_score,
      slot_code, source_type, home_source, away_source
    ) VALUES (
      p_tournament_id,
      public._knockout_resolve_source_team(p_tournament_id, 'winner:SF1'),
      public._knockout_resolve_source_team(p_tournament_id, 'winner:SF2'),
      'scheduled', 'Final', 0, 0,
      'F1', 'auto', 'winner:SF1', 'winner:SF2'
    );
    created_count := created_count + 1;
  END IF;

  -- Third place from SF losers
  IF p_include_third_place
     AND NOT EXISTS (SELECT 1 FROM public.matches WHERE tournament_id = p_tournament_id AND slot_code = 'TP1')
     AND public._knockout_resolve_source_team(p_tournament_id, 'loser:SF1') IS NOT NULL
     AND public._knockout_resolve_source_team(p_tournament_id, 'loser:SF2') IS NOT NULL THEN
    INSERT INTO public.matches (
      tournament_id, home_team_id, away_team_id, status, round_label, home_score, away_score,
      slot_code, source_type, home_source, away_source
    ) VALUES (
      p_tournament_id,
      public._knockout_resolve_source_team(p_tournament_id, 'loser:SF1'),
      public._knockout_resolve_source_team(p_tournament_id, 'loser:SF2'),
      'scheduled', 'Third Place', 0, 0,
      'TP1', 'auto', 'loser:SF1', 'loser:SF2'
    );
    created_count := created_count + 1;
  END IF;

  -- Backfill any previously created shell match with now-resolved sources.
  PERFORM public.rpc_fill_knockout_match_from_sources(m.id)
  FROM public.matches m
  WHERE m.tournament_id = p_tournament_id
    AND m.slot_code IN ('SF1', 'SF2', 'F1', 'TP1')
    AND (m.home_source IS NOT NULL OR m.away_source IS NOT NULL);

  RETURN jsonb_build_object('ok', true, 'created_count', created_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_generate_next_knockout_round(uuid, boolean) TO authenticated;
