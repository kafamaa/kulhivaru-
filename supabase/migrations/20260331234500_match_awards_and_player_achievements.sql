CREATE TABLE IF NOT EXISTS public.match_player_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  award_type text NOT NULL CHECK (award_type IN ('man_of_the_match')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, award_type)
);

CREATE TABLE IF NOT EXISTS public.tournament_player_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  achievement_key text NOT NULL CHECK (achievement_key IN ('man_of_the_match')),
  value_int int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, player_id, achievement_key)
);

CREATE OR REPLACE FUNCTION public._touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_player_awards_touch ON public.match_player_awards;
CREATE TRIGGER trg_match_player_awards_touch
  BEFORE UPDATE ON public.match_player_awards
  FOR EACH ROW
  EXECUTE FUNCTION public._touch_updated_at();

DROP TRIGGER IF EXISTS trg_tournament_player_achievements_touch ON public.tournament_player_achievements;
CREATE TRIGGER trg_tournament_player_achievements_touch
  BEFORE UPDATE ON public.tournament_player_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public._touch_updated_at();

ALTER TABLE public.match_player_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_player_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read match_player_awards" ON public.match_player_awards;
CREATE POLICY "Allow authenticated read match_player_awards"
  ON public.match_player_awards FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated read tournament_player_achievements" ON public.tournament_player_achievements;
CREATE POLICY "Allow authenticated read tournament_player_achievements"
  ON public.tournament_player_achievements FOR SELECT TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.rpc_set_match_award(
  p_match_id uuid,
  p_player_id uuid,
  p_award_type text DEFAULT 'man_of_the_match'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament_id uuid;
  v_home_team_id uuid;
  v_away_team_id uuid;
  v_player_team_id uuid;
  v_existing_player_id uuid;
BEGIN
  SELECT m.tournament_id, m.home_team_id, m.away_team_id
  INTO v_tournament_id, v_home_team_id, v_away_team_id
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF v_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT public.rpc_can_manage_tournament(v_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_award_type <> 'man_of_the_match' THEN
    RAISE EXCEPTION 'Unsupported award type';
  END IF;

  SELECT p.team_id INTO v_player_team_id
  FROM public.players p
  WHERE p.id = p_player_id;

  IF v_player_team_id IS NULL THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  IF v_player_team_id <> v_home_team_id AND v_player_team_id <> v_away_team_id THEN
    RAISE EXCEPTION 'Player is not part of this match';
  END IF;

  SELECT mpa.player_id
  INTO v_existing_player_id
  FROM public.match_player_awards mpa
  WHERE mpa.match_id = p_match_id
    AND mpa.award_type = p_award_type
  LIMIT 1;

  IF v_existing_player_id IS NOT NULL AND v_existing_player_id = p_player_id THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  INSERT INTO public.match_player_awards (match_id, tournament_id, player_id, award_type)
  VALUES (p_match_id, v_tournament_id, p_player_id, p_award_type)
  ON CONFLICT (match_id, award_type)
  DO UPDATE SET
    player_id = EXCLUDED.player_id,
    tournament_id = EXCLUDED.tournament_id,
    updated_at = now();

  IF v_existing_player_id IS NOT NULL THEN
    UPDATE public.tournament_player_achievements
    SET value_int = GREATEST(0, value_int - 1), updated_at = now()
    WHERE tournament_id = v_tournament_id
      AND player_id = v_existing_player_id
      AND achievement_key = p_award_type;

    DELETE FROM public.tournament_player_achievements
    WHERE tournament_id = v_tournament_id
      AND player_id = v_existing_player_id
      AND achievement_key = p_award_type
      AND value_int <= 0;
  END IF;

  INSERT INTO public.tournament_player_achievements (tournament_id, player_id, achievement_key, value_int)
  VALUES (v_tournament_id, p_player_id, p_award_type, 1)
  ON CONFLICT (tournament_id, player_id, achievement_key)
  DO UPDATE SET
    value_int = public.tournament_player_achievements.value_int + 1,
    updated_at = now();

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_set_match_award(uuid, uuid, text) TO authenticated;
