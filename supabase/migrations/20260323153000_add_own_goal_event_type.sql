-- Add own_goal event type support

ALTER TABLE public.match_events
  DROP CONSTRAINT IF EXISTS match_events_event_type_check;

ALTER TABLE public.match_events
  ADD CONSTRAINT match_events_event_type_check
  CHECK (
    event_type IN (
      'goal',
      'own_goal',
      'assist',
      'yellow_card',
      'red_card',
      'sub_in',
      'sub_out',
      'team_foul',
      'penalty_free_kick'
    )
  );
