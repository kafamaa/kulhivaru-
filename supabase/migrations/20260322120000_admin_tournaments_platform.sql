-- Platform admin: tournament command center — list/get RPCs, governance columns, audit-backed actions.

-- ---------------------------------------------------------------------------
-- 1) Tournament columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS admin_locked boolean NOT NULL DEFAULT false;

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS season_label text;

-- Extend lifecycle: cancelled tournaments
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;
ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_status_check
  CHECK (status IN ('draft','upcoming','ongoing','completed','archived','cancelled'));

-- Keep updated_at fresh on row changes
CREATE OR REPLACE FUNCTION public._tournaments_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tournaments_set_updated_at ON public.tournaments;
CREATE TRIGGER tournaments_set_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public._tournaments_set_updated_at();

UPDATE public.tournaments SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2) rpc_admin_list_tournaments(filters jsonb) -> { summary, rows }
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_list_tournaments(p_filters jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  v_q text;
  v_status text;
  v_org uuid;
  v_sport text;
  v_season text;
  v_date_from date;
  v_date_to date;
  v_has_issues text;
  v_locked text;
  v_no_fixtures text;
  v_unpaid text;
  v_featured text;
  v_limit int;
  result jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;

  v_q := nullif(trim(p_filters->>'q'), '');
  v_status := nullif(lower(trim(p_filters->>'status')), '');
  v_org := nullif(trim(p_filters->>'organization_id'), '')::uuid;
  v_sport := nullif(trim(p_filters->>'sport'), '');
  v_season := nullif(trim(p_filters->>'season'), '');
  v_date_from := nullif(trim(p_filters->>'date_from'), '')::date;
  v_date_to := nullif(trim(p_filters->>'date_to'), '')::date;
  v_has_issues := nullif(lower(trim(p_filters->>'has_issues')), '');
  v_locked := nullif(lower(trim(p_filters->>'locked')), '');
  v_no_fixtures := nullif(lower(trim(p_filters->>'has_no_fixtures')), '');
  v_unpaid := nullif(lower(trim(p_filters->>'has_unpaid')), '');
  v_featured := nullif(lower(trim(p_filters->>'featured')), '');

  v_limit := COALESCE(NULLIF(trim(p_filters->>'limit'), '')::int, 200);
  IF v_limit < 1 THEN v_limit := 1; END IF;
  IF v_limit > 500 THEN v_limit := 500; END IF;

  WITH enriched AS (
    SELECT
      t.*,
      o.name AS organization_name,
      (SELECT COUNT(*)::int FROM public.tournament_categories c WHERE c.tournament_id = t.id) AS categories_count,
      (SELECT COUNT(*)::int FROM public.team_entries te WHERE te.tournament_id = t.id) AS registrations_count,
      (SELECT COUNT(*)::int FROM public.team_entries te
       WHERE te.tournament_id = t.id AND te.status = 'approved') AS teams_approved_count,
      (SELECT COUNT(*)::int FROM public.matches m WHERE m.tournament_id = t.id) AS matches_count,
      (SELECT COALESCE(SUM(r.amount_paid), 0)::numeric(14,2)
       FROM public.finance_receivables r WHERE r.tournament_id = t.id) AS fees_collected,
      (SELECT COUNT(*)::int FROM public.finance_receivables r
       WHERE r.tournament_id = t.id
         AND r.amount_remaining > 0
         AND r.status NOT IN ('paid','waived','void','written_off')) AS unpaid_receivables_count,
      (
        (CASE
          WHEN t.status IN ('upcoming','ongoing','completed')
            AND NOT EXISTS (SELECT 1 FROM public.tournament_categories c WHERE c.tournament_id = t.id)
          THEN 1 ELSE 0 END)
        + (CASE
          WHEN t.status IN ('upcoming','ongoing') AND NOT EXISTS (SELECT 1 FROM public.matches m WHERE m.tournament_id = t.id)
          THEN 1 ELSE 0 END)
        + (CASE
          WHEN EXISTS (
            SELECT 1 FROM public.finance_receivables r
            WHERE r.tournament_id = t.id
              AND r.amount_remaining > 0
              AND r.status NOT IN ('paid','waived','void','written_off')
          ) THEN 1 ELSE 0 END)
      )::int AS issue_count
    FROM public.tournaments t
    LEFT JOIN public.organizations o ON o.id = t.organization_id
  ),
  filtered AS (
    SELECT * FROM enriched e
    WHERE
      (v_q IS NULL OR e.name ILIKE '%' || v_q || '%' OR e.slug ILIKE '%' || v_q || '%'
        OR e.organization_name ILIKE '%' || v_q || '%')
      AND (v_org IS NULL OR e.organization_id = v_org)
      AND (v_sport IS NULL OR e.sport ILIKE '%' || v_sport || '%')
      AND (v_season IS NULL OR COALESCE(e.season_label, '') ILIKE '%' || v_season || '%')
      AND (v_date_from IS NULL OR e.start_date IS NULL OR e.start_date >= v_date_from)
      AND (v_date_to IS NULL OR e.start_date IS NULL OR e.start_date <= v_date_to)
      AND (v_locked IS NULL OR v_locked = 'any'
        OR (v_locked = 'yes' AND e.admin_locked = true)
        OR (v_locked = 'no' AND e.admin_locked = false))
      AND (v_featured IS NULL OR v_featured = 'any'
        OR (v_featured = 'yes' AND e.is_featured = true)
        OR (v_featured = 'no' AND e.is_featured = false))
      AND (v_has_issues IS NULL OR v_has_issues = 'any'
        OR (v_has_issues = 'yes' AND e.issue_count > 0)
        OR (v_has_issues = 'no' AND e.issue_count = 0))
      AND (v_no_fixtures IS NULL OR v_no_fixtures = 'any'
        OR (v_no_fixtures = 'yes' AND e.status IN ('upcoming','ongoing') AND e.matches_count = 0)
        OR (v_no_fixtures = 'no' AND NOT (e.status IN ('upcoming','ongoing') AND e.matches_count = 0)))
      AND (v_unpaid IS NULL OR v_unpaid = 'any'
        OR (v_unpaid = 'yes' AND e.unpaid_receivables_count > 0)
        OR (v_unpaid = 'no' AND e.unpaid_receivables_count = 0))
      AND (
        v_status IS NULL
        OR v_status = ''
        OR (v_status = 'draft' AND e.status = 'draft')
        OR (v_status = 'published' AND e.status = 'upcoming')
        OR (v_status = 'live' AND e.status = 'ongoing')
        OR (v_status = 'completed' AND e.status = 'completed')
        OR (v_status = 'cancelled' AND e.status = 'cancelled')
        OR (v_status = 'archived' AND e.status = 'archived')
      )
  ),
  summary AS (
    SELECT jsonb_build_object(
      'total', (SELECT COUNT(*)::int FROM public.tournaments),
      'draft', (SELECT COUNT(*)::int FROM public.tournaments WHERE status = 'draft'),
      'published', (SELECT COUNT(*)::int FROM public.tournaments WHERE status = 'upcoming'),
      'live', (SELECT COUNT(*)::int FROM public.tournaments WHERE status = 'ongoing'),
      'completed', (SELECT COUNT(*)::int FROM public.tournaments WHERE status = 'completed'),
      'cancelled', (SELECT COUNT(*)::int FROM public.tournaments WHERE status = 'cancelled'),
      'locked', (SELECT COUNT(*)::int FROM public.tournaments WHERE admin_locked = true),
      'with_issues', (
        SELECT COUNT(*)::int FROM enriched x WHERE x.issue_count > 0
      )
    ) AS s
  ),
  rows AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', f.id,
        'name', f.name,
        'slug', f.slug,
        'sport', f.sport,
        'location', f.location,
        'season_label', f.season_label,
        'status', f.status,
        'organization_id', f.organization_id,
        'organization_name', f.organization_name,
        'is_featured', f.is_featured,
        'is_registration_open', f.is_registration_open,
        'admin_locked', f.admin_locked,
        'visibility', CASE
          WHEN f.status = 'draft' THEN 'draft'
          WHEN f.status = 'archived' THEN 'archived'
          WHEN f.status = 'cancelled' THEN 'hidden'
          ELSE 'public'
        END,
        'categories_count', f.categories_count,
        'teams_approved_count', f.teams_approved_count,
        'registrations_count', f.registrations_count,
        'matches_count', f.matches_count,
        'fees_collected', f.fees_collected,
        'unpaid_receivables_count', f.unpaid_receivables_count,
        'issue_count', f.issue_count,
        'start_date', f.start_date,
        'end_date', f.end_date,
        'created_at', f.created_at,
        'updated_at', f.updated_at
      ) ORDER BY f.updated_at DESC NULLS LAST, f.created_at DESC
    ), '[]'::jsonb) AS r
    FROM (SELECT * FROM filtered ORDER BY updated_at DESC NULLS LAST, created_at DESC LIMIT v_limit) f
  )
  SELECT jsonb_build_object('summary', (SELECT s FROM summary), 'rows', (SELECT r FROM rows))
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_list_tournaments(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_list_tournaments(jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) rpc_admin_get_tournament(tournament_id) -> jsonb
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_get_tournament(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  t_row record;
  organization jsonb;
  categories jsonb;
  audit jsonb;
  counts jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;

  SELECT * INTO t_row FROM public.tournaments t WHERE t.id = p_tournament_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  SELECT jsonb_build_object(
    'id', o.id,
    'name', o.name,
    'slug', o.slug
  ) INTO organization
  FROM public.organizations o
  WHERE o.id = t_row.organization_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'short_label', c.short_label,
      'max_teams', c.max_teams,
      'min_teams', c.min_teams,
      'visibility', c.visibility,
      'sort_order', c.sort_order
    ) ORDER BY c.sort_order, c.name
  ), '[]'::jsonb) INTO categories
  FROM public.tournament_categories c
  WHERE c.tournament_id = p_tournament_id;

  SELECT COALESCE(jsonb_agg(x.entry ORDER BY x.created_at DESC), '[]'::jsonb) INTO audit
  FROM (
    SELECT
      l.created_at,
      jsonb_build_object(
        'id', l.id,
        'action', l.action,
        'created_at', l.created_at,
        'reason', l.reason,
        'before_json', l.before_json,
        'after_json', l.after_json,
        'actor_id', l.actor_id
      ) AS entry
    FROM public.platform_admin_audit_log l
    WHERE l.entity_type = 'tournament' AND l.entity_id = p_tournament_id
    ORDER BY l.created_at DESC
    LIMIT 100
  ) x;

  counts := jsonb_build_object(
    'categories', (SELECT COUNT(*)::int FROM public.tournament_categories c WHERE c.tournament_id = p_tournament_id),
    'registrations', (SELECT COUNT(*)::int FROM public.team_entries te WHERE te.tournament_id = p_tournament_id),
    'teams_approved', (SELECT COUNT(*)::int FROM public.team_entries te WHERE te.tournament_id = p_tournament_id AND te.status = 'approved'),
    'matches', (SELECT COUNT(*)::int FROM public.matches m WHERE m.tournament_id = p_tournament_id),
    'fees_collected', (SELECT COALESCE(SUM(r.amount_paid), 0)::numeric(14,2) FROM public.finance_receivables r WHERE r.tournament_id = p_tournament_id),
    'unpaid_receivables', (SELECT COUNT(*)::int FROM public.finance_receivables r
      WHERE r.tournament_id = p_tournament_id
        AND r.amount_remaining > 0
        AND r.status NOT IN ('paid','waived','void','written_off'))
  );

  RETURN jsonb_build_object(
    'tournament', to_jsonb(t_row),
    'organization', organization,
    'counts', counts,
    'categories', categories,
    'audit', audit
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_get_tournament(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_get_tournament(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) rpc_admin_update_tournament
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_update_tournament(
  p_tournament_id uuid,
  p_payload jsonb,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_row jsonb;
  after_row jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;

  SELECT to_jsonb(t.*) INTO before_row FROM public.tournaments t WHERE t.id = p_tournament_id;
  IF before_row IS NULL THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  UPDATE public.tournaments tr SET
    is_featured = CASE WHEN p_payload ? 'is_featured' THEN (p_payload->>'is_featured')::boolean ELSE tr.is_featured END,
    is_registration_open = CASE WHEN p_payload ? 'is_registration_open' THEN (p_payload->>'is_registration_open')::boolean ELSE tr.is_registration_open END,
    season_label = CASE
      WHEN p_payload ? 'season_label' AND (p_payload->>'season_label') = '' THEN NULL
      WHEN p_payload ? 'season_label' THEN nullif(trim(p_payload->>'season_label'), '')
      ELSE tr.season_label
    END,
    name = COALESCE(nullif(trim(p_payload->>'name'), ''), tr.name),
    location = CASE WHEN p_payload ? 'location' THEN nullif(trim(p_payload->>'location'), '') ELSE tr.location END
  WHERE tr.id = p_tournament_id;

  SELECT to_jsonb(t.*) INTO after_row FROM public.tournaments t WHERE t.id = p_tournament_id;

  PERFORM public._platform_admin_audit(
    'tournament.update',
    'tournament',
    p_tournament_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );

  RETURN jsonb_build_object('ok', true, 'tournament', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_update_tournament(uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_update_tournament(uuid, jsonb, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) Lifecycle + lock RPCs (audit logged)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_tournament_publish(
  p_tournament_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_row jsonb;
  after_row jsonb;
  st text;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT status INTO st FROM public.tournaments t WHERE t.id = p_tournament_id;
  IF st IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF st <> 'draft' THEN
    RAISE EXCEPTION 'Only draft tournaments can be force-published';
  END IF;

  SELECT to_jsonb(t.*) INTO before_row FROM public.tournaments t WHERE t.id = p_tournament_id;
  UPDATE public.tournaments SET status = 'upcoming' WHERE id = p_tournament_id;
  SELECT to_jsonb(t.*) INTO after_row FROM public.tournaments t WHERE t.id = p_tournament_id;

  PERFORM public._platform_admin_audit(
    'tournament.publish',
    'tournament',
    p_tournament_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'tournament', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_tournament_publish(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_tournament_publish(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_tournament_unpublish(
  p_tournament_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_row jsonb;
  after_row jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT to_jsonb(t.*) INTO before_row FROM public.tournaments t WHERE t.id = p_tournament_id;
  IF before_row IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  UPDATE public.tournaments SET status = 'draft' WHERE id = p_tournament_id;
  SELECT to_jsonb(t.*) INTO after_row FROM public.tournaments t WHERE t.id = p_tournament_id;

  PERFORM public._platform_admin_audit(
    'tournament.unpublish',
    'tournament',
    p_tournament_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'tournament', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_tournament_unpublish(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_tournament_unpublish(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_tournament_cancel(
  p_tournament_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_row jsonb;
  after_row jsonb;
  st text;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT status INTO st FROM public.tournaments t WHERE t.id = p_tournament_id;
  IF st IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF st = 'cancelled' THEN RAISE EXCEPTION 'Already cancelled'; END IF;

  SELECT to_jsonb(t.*) INTO before_row FROM public.tournaments t WHERE t.id = p_tournament_id;
  UPDATE public.tournaments SET status = 'cancelled' WHERE id = p_tournament_id;
  SELECT to_jsonb(t.*) INTO after_row FROM public.tournaments t WHERE t.id = p_tournament_id;

  PERFORM public._platform_admin_audit(
    'tournament.cancel',
    'tournament',
    p_tournament_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'tournament', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_tournament_cancel(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_tournament_cancel(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_tournament_archive(
  p_tournament_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_row jsonb;
  after_row jsonb;
  st text;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT status INTO st FROM public.tournaments t WHERE t.id = p_tournament_id;
  IF st IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF st = 'archived' THEN RAISE EXCEPTION 'Already archived'; END IF;

  SELECT to_jsonb(t.*) INTO before_row FROM public.tournaments t WHERE t.id = p_tournament_id;
  UPDATE public.tournaments SET status = 'archived' WHERE id = p_tournament_id;
  SELECT to_jsonb(t.*) INTO after_row FROM public.tournaments t WHERE t.id = p_tournament_id;

  PERFORM public._platform_admin_audit(
    'tournament.archive',
    'tournament',
    p_tournament_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'tournament', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_tournament_archive(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_tournament_archive(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_tournament_set_locked(
  p_tournament_id uuid,
  p_locked boolean,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_row jsonb;
  after_row jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT to_jsonb(t.*) INTO before_row FROM public.tournaments t WHERE t.id = p_tournament_id;
  IF before_row IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  UPDATE public.tournaments SET admin_locked = p_locked WHERE id = p_tournament_id;
  SELECT to_jsonb(t.*) INTO after_row FROM public.tournaments t WHERE t.id = p_tournament_id;

  PERFORM public._platform_admin_audit(
    CASE WHEN p_locked THEN 'tournament.lock' ELSE 'tournament.unlock' END,
    'tournament',
    p_tournament_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'tournament', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_tournament_set_locked(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_tournament_set_locked(uuid, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_tournament_set_featured(
  p_tournament_id uuid,
  p_featured boolean,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_row jsonb;
  after_row jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT to_jsonb(t.*) INTO before_row FROM public.tournaments t WHERE t.id = p_tournament_id;
  IF before_row IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;

  UPDATE public.tournaments SET is_featured = p_featured WHERE id = p_tournament_id;
  SELECT to_jsonb(t.*) INTO after_row FROM public.tournaments t WHERE t.id = p_tournament_id;

  PERFORM public._platform_admin_audit(
    CASE WHEN p_featured THEN 'tournament.featured.on' ELSE 'tournament.featured.off' END,
    'tournament',
    p_tournament_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'tournament', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_tournament_set_featured(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_tournament_set_featured(uuid, boolean, text) TO authenticated;
