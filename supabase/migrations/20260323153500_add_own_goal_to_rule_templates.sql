-- Add own_goal to template event types where goals exist

UPDATE public.sport_rule_templates
SET rule_config = jsonb_set(
  rule_config,
  '{event_types}',
  (
    COALESCE(rule_config->'event_types', '[]'::jsonb) || '"own_goal"'::jsonb
  ),
  true
)
WHERE rule_config ? 'event_types'
  AND (rule_config->'event_types') @> '["goal"]'::jsonb
  AND NOT ((rule_config->'event_types') @> '["own_goal"]'::jsonb);
