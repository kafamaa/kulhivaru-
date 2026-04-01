-- Team-based champion/runner-up awards:
-- selecting a team grants the award to all players in that team.

ALTER TABLE public.tournament_awards
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.tournament_awards
ALTER COLUMN player_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.rpc_set_tournament_award(
  p_tournament_id uuid,
  p_award_key text,
  p_player_id uuid DEFAULT NULL,
  p_trophy_title text DEFAULT NULL,
  p_trophy_image_url text DEFAULT NULL,
  p_team_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_player_id uuid;
  v_old_team_id uuid;
  v_player_team_id uuid;
BEGIN
  IF NOT public.rpc_can_manage_tournament(p_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_award_key NOT IN (
    'mvp',
    'best_goalkeeper',
    'best_defender',
    'young_player',
    'top_scorer',
    'best_assist_provider',
    'champion_trophy',
    'runner_up_trophy'
  ) THEN
    RAISE EXCEPTION 'Unsupported award key';
  END IF;

  SELECT ta.player_id, ta.team_id
  INTO v_old_player_id, v_old_team_id
  FROM public.tournament_awards ta
  WHERE ta.tournament_id = p_tournament_id
    AND ta.award_key = p_award_key
  LIMIT 1;

  -- Clear award
  IF p_player_id IS NULL AND p_team_id IS NULL THEN
    DELETE FROM public.tournament_awards
    WHERE tournament_id = p_tournament_id
      AND award_key = p_award_key;

    IF v_old_team_id IS NOT NULL THEN
      UPDATE public.tournament_player_achievements tpa
      SET value_int = GREATEST(0, tpa.value_int - 1), updated_at = now()
      WHERE tpa.tournament_id = p_tournament_id
        AND tpa.achievement_key = p_award_key
        AND tpa.player_id IN (SELECT p.id FROM public.players p WHERE p.team_id = v_old_team_id);

      DELETE FROM public.tournament_player_achievements tpa
      WHERE tpa.tournament_id = p_tournament_id
        AND tpa.achievement_key = p_award_key
        AND tpa.player_id IN (SELECT p.id FROM public.players p WHERE p.team_id = v_old_team_id)
        AND tpa.value_int <= 0;
    ELSIF v_old_player_id IS NOT NULL THEN
      UPDATE public.tournament_player_achievements
      SET value_int = GREATEST(0, value_int - 1), updated_at = now()
      WHERE tournament_id = p_tournament_id
        AND player_id = v_old_player_id
        AND achievement_key = p_award_key;

      DELETE FROM public.tournament_player_achievements
      WHERE tournament_id = p_tournament_id
        AND player_id = v_old_player_id
        AND achievement_key = p_award_key
        AND value_int <= 0;
    END IF;

    RETURN jsonb_build_object('ok', true);
  END IF;

  -- Team awards
  IF p_award_key IN ('champion_trophy', 'runner_up_trophy') THEN
    IF p_team_id IS NULL THEN
      RAISE EXCEPTION 'Team is required for this award';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.team_entries te
      WHERE te.tournament_id = p_tournament_id
        AND te.team_id = p_team_id
    ) THEN
      RAISE EXCEPTION 'Team is not in this tournament';
    END IF;

    INSERT INTO public.tournament_awards (
      tournament_id,
      award_key,
      player_id,
      team_id,
      trophy_title,
      trophy_image_url
    )
    VALUES (
      p_tournament_id,
      p_award_key,
      NULL,
      p_team_id,
      NULLIF(trim(COALESCE(p_trophy_title, '')), ''),
      NULLIF(trim(COALESCE(p_trophy_image_url, '')), '')
    )
    ON CONFLICT (tournament_id, award_key)
    DO UPDATE SET
      player_id = NULL,
      team_id = EXCLUDED.team_id,
      trophy_title = EXCLUDED.trophy_title,
      trophy_image_url = EXCLUDED.trophy_image_url,
      updated_at = now();

    -- If team changed, remove old achievements from previous team players.
    IF v_old_team_id IS NOT NULL AND v_old_team_id <> p_team_id THEN
      UPDATE public.tournament_player_achievements tpa
      SET value_int = GREATEST(0, tpa.value_int - 1), updated_at = now()
      WHERE tpa.tournament_id = p_tournament_id
        AND tpa.achievement_key = p_award_key
        AND tpa.player_id IN (SELECT p.id FROM public.players p WHERE p.team_id = v_old_team_id);

      DELETE FROM public.tournament_player_achievements tpa
      WHERE tpa.tournament_id = p_tournament_id
        AND tpa.achievement_key = p_award_key
        AND tpa.player_id IN (SELECT p.id FROM public.players p WHERE p.team_id = v_old_team_id)
        AND tpa.value_int <= 0;
    ELSIF v_old_player_id IS NOT NULL THEN
      UPDATE public.tournament_player_achievements
      SET value_int = GREATEST(0, value_int - 1), updated_at = now()
      WHERE tournament_id = p_tournament_id
        AND player_id = v_old_player_id
        AND achievement_key = p_award_key;

      DELETE FROM public.tournament_player_achievements
      WHERE tournament_id = p_tournament_id
        AND player_id = v_old_player_id
        AND achievement_key = p_award_key
        AND value_int <= 0;
    END IF;

    -- Only add when award is newly assigned or changed.
    IF v_old_team_id IS NULL OR v_old_team_id <> p_team_id OR v_old_player_id IS NOT NULL THEN
      INSERT INTO public.tournament_player_achievements (tournament_id, player_id, achievement_key, value_int)
      SELECT p_tournament_id, p.id, p_award_key, 1
      FROM public.players p
      WHERE p.team_id = p_team_id
      ON CONFLICT (tournament_id, player_id, achievement_key)
      DO UPDATE SET
        value_int = public.tournament_player_achievements.value_int + 1,
        updated_at = now();
    END IF;

    RETURN jsonb_build_object('ok', true);
  END IF;

  -- Individual player awards
  IF p_player_id IS NULL THEN
    RAISE EXCEPTION 'Player is required for this award';
  END IF;

  SELECT p.team_id INTO v_player_team_id
  FROM public.players p
  WHERE p.id = p_player_id;

  IF v_player_team_id IS NULL THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.team_entries te
    WHERE te.tournament_id = p_tournament_id
      AND te.team_id = v_player_team_id
  ) THEN
    RAISE EXCEPTION 'Player is not in this tournament';
  END IF;

  INSERT INTO public.tournament_awards (
    tournament_id,
    award_key,
    player_id,
    team_id,
    trophy_title,
    trophy_image_url
  )
  VALUES (
    p_tournament_id,
    p_award_key,
    p_player_id,
    NULL,
    NULLIF(trim(COALESCE(p_trophy_title, '')), ''),
    NULLIF(trim(COALESCE(p_trophy_image_url, '')), '')
  )
  ON CONFLICT (tournament_id, award_key)
  DO UPDATE SET
    player_id = EXCLUDED.player_id,
    team_id = NULL,
    trophy_title = EXCLUDED.trophy_title,
    trophy_image_url = EXCLUDED.trophy_image_url,
    updated_at = now();

  IF v_old_team_id IS NOT NULL THEN
    UPDATE public.tournament_player_achievements tpa
    SET value_int = GREATEST(0, tpa.value_int - 1), updated_at = now()
    WHERE tpa.tournament_id = p_tournament_id
      AND tpa.achievement_key = p_award_key
      AND tpa.player_id IN (SELECT p.id FROM public.players p WHERE p.team_id = v_old_team_id);

    DELETE FROM public.tournament_player_achievements tpa
    WHERE tpa.tournament_id = p_tournament_id
      AND tpa.achievement_key = p_award_key
      AND tpa.player_id IN (SELECT p.id FROM public.players p WHERE p.team_id = v_old_team_id)
      AND tpa.value_int <= 0;
  ELSIF v_old_player_id IS NOT NULL AND v_old_player_id <> p_player_id THEN
    UPDATE public.tournament_player_achievements
    SET value_int = GREATEST(0, value_int - 1), updated_at = now()
    WHERE tournament_id = p_tournament_id
      AND player_id = v_old_player_id
      AND achievement_key = p_award_key;

    DELETE FROM public.tournament_player_achievements
    WHERE tournament_id = p_tournament_id
      AND player_id = v_old_player_id
      AND achievement_key = p_award_key
      AND value_int <= 0;
  END IF;

  IF v_old_player_id IS NULL OR v_old_player_id <> p_player_id OR v_old_team_id IS NOT NULL THEN
    INSERT INTO public.tournament_player_achievements (tournament_id, player_id, achievement_key, value_int)
    VALUES (p_tournament_id, p_player_id, p_award_key, 1)
    ON CONFLICT (tournament_id, player_id, achievement_key)
    DO UPDATE SET
      value_int = public.tournament_player_achievements.value_int + 1,
      updated_at = now();
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_set_tournament_award(uuid, text, uuid, text, text, uuid) TO authenticated;
