-- Admin: global registration desk — team_entries governance, finance hooks, audit-backed RPCs.

-- ---------------------------------------------------------------------------
-- 1) team_entries extensions
-- ---------------------------------------------------------------------------
ALTER TABLE public.team_entries DROP CONSTRAINT IF EXISTS team_entries_status_check;
ALTER TABLE public.team_entries
  ADD CONSTRAINT team_entries_status_check
  CHECK (status IN ('pending','approved','rejected','cancelled','withdrawn'));

ALTER TABLE public.team_entries
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.team_entries
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.team_entries
  ADD COLUMN IF NOT EXISTS admin_notes text;

ALTER TABLE public.team_entries
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.tournament_categories(id) ON DELETE SET NULL;

UPDATE public.team_entries SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;

CREATE OR REPLACE FUNCTION public._team_entries_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS team_entries_set_updated_at ON public.team_entries;
CREATE TRIGGER team_entries_set_updated_at
  BEFORE UPDATE ON public.team_entries
  FOR EACH ROW
  EXECUTE FUNCTION public._team_entries_set_updated_at();

CREATE INDEX IF NOT EXISTS team_entries_tournament_idx ON public.team_entries(tournament_id);
CREATE INDEX IF NOT EXISTS team_entries_status_idx ON public.team_entries(status);
CREATE INDEX IF NOT EXISTS team_entries_created_idx ON public.team_entries(created_at DESC);

-- ---------------------------------------------------------------------------
-- 2) Helpers: payment bucket + default payment account
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._admin_receivable_payment_bucket(r public.finance_receivables)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN r.id IS NULL THEN 'none'
    WHEN r.status = 'waived' THEN 'waived'
    WHEN r.status IN ('void','written_off') THEN 'voided'
    WHEN r.status = 'paid' OR (COALESCE(r.amount_remaining, 0) <= 0 AND COALESCE(r.amount_paid, 0) > 0) THEN 'paid'
    WHEN r.status = 'partial' OR (COALESCE(r.amount_paid, 0) > 0 AND COALESCE(r.amount_remaining, 0) > 0) THEN 'partial'
    ELSE 'unpaid'
  END;
$$;

CREATE OR REPLACE FUNCTION public._admin_default_payment_account_id(p_tournament_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT fa.id
  FROM public.finance_accounts fa
  WHERE fa.tournament_id = p_tournament_id
    AND fa.active = true
    AND fa.account_type IN ('cash','bank','wallet')
  ORDER BY fa.is_default DESC, fa.created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public._admin_receivable_account_id(p_tournament_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT fa.id
  FROM public.finance_accounts fa
  WHERE fa.tournament_id = p_tournament_id
    AND fa.account_type = 'receivable'
  LIMIT 1;
$$;

-- Ensure receivable row for a team entry (from tournament finance settings).
CREATE OR REPLACE FUNCTION public._admin_ensure_receivable(p_entry_id uuid)
RETURNS public.finance_receivables
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  te record;
  fs record;
  rec public.finance_receivables;
BEGIN
  SELECT * INTO te FROM public.team_entries WHERE id = p_entry_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team entry not found';
  END IF;

  SELECT * INTO rec FROM public.finance_receivables r WHERE r.team_entry_id = p_entry_id LIMIT 1;
  IF FOUND THEN
    RETURN rec;
  END IF;

  SELECT * INTO fs FROM public.tournament_finance_settings s WHERE s.tournament_id = te.tournament_id;
  INSERT INTO public.finance_receivables (
    tournament_id, team_entry_id, amount_due, amount_paid, amount_waived, amount_remaining, status
  ) VALUES (
    te.tournament_id,
    p_entry_id,
    COALESCE(fs.entry_fee_amount, 0),
    0,
    0,
    COALESCE(fs.entry_fee_amount, 0),
    CASE WHEN COALESCE(fs.entry_fee_amount, 0) <= 0 THEN 'paid' ELSE 'open' END
  )
  RETURNING * INTO rec;

  RETURN rec;
END;
$$;

REVOKE ALL ON FUNCTION public._admin_ensure_receivable(uuid) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 3) rpc_admin_list_registrations(filters jsonb)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_list_registrations(p_filters jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  v_q text;
  v_entry_status text;
  v_payment text;
  v_tournament uuid;
  v_org uuid;
  v_category uuid;
  v_sport text;
  v_from timestamptz;
  v_to timestamptz;
  v_reviewed_by uuid;
  v_flags text;
  v_dup text;
  v_attention text;
  v_limit int;
  result jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;

  v_q := nullif(trim(p_filters->>'q'), '');
  v_entry_status := nullif(lower(trim(p_filters->>'entry_status')), '');
  v_payment := nullif(lower(trim(p_filters->>'payment')), '');
  v_tournament := nullif(trim(p_filters->>'tournament_id'), '')::uuid;
  v_org := nullif(trim(p_filters->>'organization_id'), '')::uuid;
  v_category := nullif(trim(p_filters->>'category_id'), '')::uuid;
  v_sport := nullif(trim(p_filters->>'sport'), '');
  v_from := nullif(trim(p_filters->>'submitted_from'), '')::timestamptz;
  v_to := nullif(trim(p_filters->>'submitted_to'), '')::timestamptz;
  v_reviewed_by := nullif(trim(p_filters->>'reviewed_by'), '')::uuid;
  v_flags := nullif(lower(trim(p_filters->>'has_flags')), '');
  v_dup := nullif(lower(trim(p_filters->>'duplicate_suspects')), '');
  v_attention := nullif(lower(trim(p_filters->>'requires_attention')), '');

  v_limit := COALESCE(NULLIF(trim(p_filters->>'limit'), '')::int, 200);
  IF v_limit < 1 THEN v_limit := 1; END IF;
  IF v_limit > 500 THEN v_limit := 500; END IF;

  WITH enriched AS (
    SELECT
      te.*,
      t.name AS tournament_name,
      t.slug AS tournament_slug,
      t.sport AS tournament_sport,
      t.organization_id,
      o.name AS organization_name,
      o.slug AS organization_slug,
      o.org_status AS organization_status,
      tm.name AS team_name,
      tm.slug AS team_slug,
      c.name AS category_name,
      c.id AS category_resolved_id,
      r.id AS receivable_id,
      r.amount_due,
      r.amount_paid,
      r.amount_waived,
      r.amount_remaining,
      r.status AS receivable_status,
      CASE
        WHEN r.id IS NULL THEN 'none'
        ELSE public._admin_receivable_payment_bucket(r)
      END AS payment_bucket,
      (SELECT p.display_name FROM public.profiles p WHERE p.id = te.reviewed_by) AS reviewed_by_name,
      (
        (CASE
          WHEN te.status = 'approved' AND r.id IS NOT NULL
            AND r.status NOT IN ('waived','paid')
            AND COALESCE(r.amount_remaining, 0) > 0
          THEN 1 ELSE 0 END)
        + (CASE
          WHEN te.status = 'pending' AND r.id IS NOT NULL
            AND (r.status = 'paid' OR (COALESCE(r.amount_remaining, 0) <= 0 AND COALESCE(r.amount_paid, 0) > 0))
          THEN 1 ELSE 0 END)
        + (CASE
          WHEN EXISTS (
            SELECT 1 FROM public.team_entries te3
            JOIN public.teams t3 ON t3.id = te3.team_id
            WHERE te3.tournament_id = te.tournament_id AND te3.id <> te.id
              AND lower(trim(t3.name)) = lower(trim(tm.name))
          ) THEN 1 ELSE 0 END)
        + (CASE WHEN o.org_status = 'suspended' THEN 1 ELSE 0 END)
      )::int AS issue_count,
      EXISTS (
        SELECT 1 FROM public.team_entries te3
        JOIN public.teams t3 ON t3.id = te3.team_id
        WHERE te3.tournament_id = te.tournament_id AND te3.id <> te.id
          AND lower(trim(t3.name)) = lower(trim(tm.name))
      ) AS duplicate_name_suspect
    FROM public.team_entries te
    INNER JOIN public.tournaments t ON t.id = te.tournament_id
    LEFT JOIN public.organizations o ON o.id = t.organization_id
    INNER JOIN public.teams tm ON tm.id = te.team_id
    LEFT JOIN public.tournament_categories c ON c.id = te.category_id
    LEFT JOIN public.finance_receivables r ON r.team_entry_id = te.id
  ),
  filtered AS (
    SELECT * FROM enriched e
    WHERE
      (v_q IS NULL OR e.id::text ILIKE '%' || v_q || '%'
        OR e.tournament_name ILIKE '%' || v_q || '%'
        OR e.team_name ILIKE '%' || v_q || '%'
        OR COALESCE(e.category_name, '') ILIKE '%' || v_q || '%'
        OR COALESCE(e.organization_name, '') ILIKE '%' || v_q || '%')
      AND (v_entry_status IS NULL OR e.status = v_entry_status)
      AND (v_payment IS NULL OR v_payment = '' OR v_payment = 'any' OR e.payment_bucket = v_payment)
      AND (v_tournament IS NULL OR e.tournament_id = v_tournament)
      AND (v_org IS NULL OR e.organization_id = v_org)
      AND (v_category IS NULL OR e.category_id = v_category OR e.category_resolved_id = v_category)
      AND (v_sport IS NULL OR e.tournament_sport ILIKE '%' || v_sport || '%')
      AND (v_from IS NULL OR e.created_at >= v_from)
      AND (v_to IS NULL OR e.created_at < v_to + interval '1 day')
      AND (v_reviewed_by IS NULL OR e.reviewed_by = v_reviewed_by)
      AND (v_flags IS NULL OR v_flags = '' OR v_flags = 'any'
        OR (v_flags = 'yes' AND e.issue_count > 0)
        OR (v_flags = 'no' AND e.issue_count = 0))
      AND (v_dup IS NULL OR v_dup = '' OR v_dup = 'any'
        OR (v_dup = 'yes' AND e.duplicate_name_suspect = true)
        OR (v_dup = 'no' AND e.duplicate_name_suspect = false))
      AND (v_attention IS NULL OR v_attention = '' OR v_attention = 'any'
        OR (v_attention = 'yes' AND e.issue_count > 0)
        OR (v_attention = 'no' AND e.issue_count = 0))
  ),
  summary AS (
    SELECT jsonb_build_object(
      'total', (SELECT COUNT(*)::int FROM filtered),
      'pending', (SELECT COUNT(*)::int FROM filtered WHERE status = 'pending'),
      'approved', (SELECT COUNT(*)::int FROM filtered WHERE status = 'approved'),
      'rejected', (SELECT COUNT(*)::int FROM filtered WHERE status = 'rejected'),
      'cancelled', (SELECT COUNT(*)::int FROM filtered WHERE status IN ('cancelled','withdrawn')),
      'paid', (SELECT COUNT(*)::int FROM filtered WHERE payment_bucket = 'paid'),
      'unpaid', (SELECT COUNT(*)::int FROM filtered WHERE payment_bucket = 'unpaid'),
      'waived', (SELECT COUNT(*)::int FROM filtered WHERE payment_bucket = 'waived'),
      'partial', (SELECT COUNT(*)::int FROM filtered WHERE payment_bucket = 'partial'),
      'voided', (SELECT COUNT(*)::int FROM filtered WHERE payment_bucket = 'voided'),
      'duplicate_suspects', (SELECT COUNT(*)::int FROM filtered WHERE duplicate_name_suspect = true),
      'flagged', (SELECT COUNT(*)::int FROM filtered WHERE issue_count > 0)
    ) AS s
  ),
  rows AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', f.id,
        'tournament_id', f.tournament_id,
        'tournament_name', f.tournament_name,
        'tournament_slug', f.tournament_slug,
        'sport', f.tournament_sport,
        'organization_id', f.organization_id,
        'organization_name', f.organization_name,
        'team_id', f.team_id,
        'team_name', f.team_name,
        'team_slug', f.team_slug,
        'category_id', f.category_id,
        'category_name', f.category_name,
        'entry_status', f.status,
        'payment_bucket', f.payment_bucket,
        'receivable_id', f.receivable_id,
        'amount_due', COALESCE(f.amount_due, 0),
        'amount_paid', COALESCE(f.amount_paid, 0),
        'amount_remaining', COALESCE(f.amount_remaining, 0),
        'receivable_status', f.receivable_status,
        'created_at', f.created_at,
        'updated_at', f.updated_at,
        'reviewed_by', f.reviewed_by,
        'reviewed_by_name', f.reviewed_by_name,
        'issue_count', f.issue_count,
        'duplicate_name_suspect', f.duplicate_name_suspect,
        'admin_notes', f.admin_notes
      ) ORDER BY f.created_at DESC
    ), '[]'::jsonb) AS r
    FROM (SELECT * FROM filtered ORDER BY created_at DESC LIMIT v_limit) f
  )
  SELECT jsonb_build_object('summary', (SELECT s FROM summary), 'rows', (SELECT r FROM rows))
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_list_registrations(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_list_registrations(jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) rpc_admin_get_registration(entry_id)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_get_registration(p_entry_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  payload jsonb;
  payments jsonb;
  audit jsonb;
  issues jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;

  payload := NULL;

  SELECT jsonb_build_object(
    'entry', row_to_json(te.*)::jsonb,
    'tournament', row_to_json(t.*)::jsonb,
    'organization', row_to_json(o.*)::jsonb,
    'team', row_to_json(tm.*)::jsonb,
    'category', CASE WHEN c.id IS NULL THEN NULL ELSE row_to_json(c.*)::jsonb END,
    'receivable', CASE WHEN r.id IS NULL THEN NULL ELSE row_to_json(r.*)::jsonb END,
    'payment_bucket', CASE WHEN r.id IS NULL THEN 'none' ELSE public._admin_receivable_payment_bucket(r) END,
    'reviewed_by_name', (SELECT p.display_name FROM public.profiles p WHERE p.id = te.reviewed_by)
  ) INTO payload
  FROM public.team_entries te
  INNER JOIN public.tournaments t ON t.id = te.tournament_id
  LEFT JOIN public.organizations o ON o.id = t.organization_id
  INNER JOIN public.teams tm ON tm.id = te.team_id
  LEFT JOIN public.tournament_categories c ON c.id = te.category_id
  LEFT JOIN public.finance_receivables r ON r.team_entry_id = te.id
  WHERE te.id = p_entry_id;

  IF payload IS NULL OR (payload->'entry') IS NULL OR payload->'entry' = 'null'::jsonb THEN
    RAISE EXCEPTION 'Registration not found';
  END IF;

  SELECT COALESCE(jsonb_agg(x.obj ORDER BY x.payment_date DESC NULLS LAST), '[]'::jsonb) INTO payments
  FROM (
    SELECT
      p.payment_date,
      jsonb_build_object(
        'id', p.id,
        'amount', p.amount,
        'payment_date', p.payment_date,
        'reference', p.reference,
        'notes', p.notes,
        'status', p.status,
        'account_id', p.account_id
      ) AS obj
    FROM public.finance_payments p
    WHERE p.team_entry_id = p_entry_id
    ORDER BY p.payment_date DESC NULLS LAST
    LIMIT 50
  ) x;

  SELECT COALESCE(jsonb_agg(x.entry ORDER BY x.created_at DESC), '[]'::jsonb) INTO audit
  FROM (
    SELECT
      l.created_at,
      jsonb_build_object(
        'id', l.id,
        'action', l.action,
        'created_at', l.created_at,
        'reason', l.reason,
        'actor_id', l.actor_id,
        'before_json', l.before_json,
        'after_json', l.after_json
      ) AS entry
    FROM public.platform_admin_audit_log l
    WHERE l.entity_type = 'registration' AND l.entity_id = p_entry_id
    ORDER BY l.created_at DESC
    LIMIT 100
  ) x;

  issues := '[]'::jsonb;

  RETURN payload || jsonb_build_object(
    'payments', payments,
    'audit', audit,
    'validation_issues', issues
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_get_registration(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_get_registration(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) Action RPCs (audit entity_type = registration, entity_id = team_entry.id)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_approve_entry(p_entry_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_e jsonb;
  after_e jsonb;
  n int;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;

  SELECT to_jsonb(e.*) INTO before_e FROM public.team_entries e WHERE e.id = p_entry_id;
  IF before_e IS NULL THEN RAISE EXCEPTION 'Registration not found'; END IF;

  UPDATE public.team_entries
  SET status = 'approved', reviewed_by = uid, updated_at = now()
  WHERE id = p_entry_id AND status = 'pending';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RAISE EXCEPTION 'Only pending entries can be approved (use force approve if needed)';
  END IF;

  SELECT to_jsonb(e.*) INTO after_e FROM public.team_entries e WHERE e.id = p_entry_id;

  PERFORM public._platform_admin_audit(
    'registration.approve',
    'registration',
    p_entry_id,
    before_e,
    after_e,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'entry', after_e);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_approve_entry(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_approve_entry(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_force_approve_entry(p_entry_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_e jsonb;
  after_e jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT to_jsonb(e.*) INTO before_e FROM public.team_entries e WHERE e.id = p_entry_id;
  IF before_e IS NULL THEN RAISE EXCEPTION 'Registration not found'; END IF;

  UPDATE public.team_entries
  SET status = 'approved', reviewed_by = uid, updated_at = now()
  WHERE id = p_entry_id;

  SELECT to_jsonb(e.*) INTO after_e FROM public.team_entries e WHERE e.id = p_entry_id;

  PERFORM public._platform_admin_audit(
    'registration.force_approve',
    'registration',
    p_entry_id,
    before_e,
    after_e,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'entry', after_e);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_force_approve_entry(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_force_approve_entry(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_reject_entry(p_entry_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_e jsonb;
  after_e jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT to_jsonb(e.*) INTO before_e FROM public.team_entries e WHERE e.id = p_entry_id;
  IF before_e IS NULL THEN RAISE EXCEPTION 'Registration not found'; END IF;

  UPDATE public.team_entries
  SET status = 'rejected', reviewed_by = uid, updated_at = now()
  WHERE id = p_entry_id;

  SELECT to_jsonb(e.*) INTO after_e FROM public.team_entries e WHERE e.id = p_entry_id;

  PERFORM public._platform_admin_audit(
    'registration.reject',
    'registration',
    p_entry_id,
    before_e,
    after_e,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'entry', after_e);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_reject_entry(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_reject_entry(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_reset_entry_status(p_entry_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_e jsonb;
  after_e jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT to_jsonb(e.*) INTO before_e FROM public.team_entries e WHERE e.id = p_entry_id;
  IF before_e IS NULL THEN RAISE EXCEPTION 'Registration not found'; END IF;

  UPDATE public.team_entries
  SET status = 'pending', reviewed_by = NULL, updated_at = now()
  WHERE id = p_entry_id;

  SELECT to_jsonb(e.*) INTO after_e FROM public.team_entries e WHERE e.id = p_entry_id;

  PERFORM public._platform_admin_audit(
    'registration.reset_pending',
    'registration',
    p_entry_id,
    before_e,
    after_e,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'entry', after_e);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_reset_entry_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_reset_entry_status(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_mark_entry_paid(
  p_entry_id uuid,
  p_amount numeric,
  p_method text,
  p_reference text,
  p_notes text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  t_id uuid;
  pay_acc uuid;
  rec_acc uuid;
  rec public.finance_receivables;
  before_r jsonb;
  after_r jsonb;
  v_amt numeric;
  new_paid numeric;
  new_rem numeric;
  new_st text;
  note text;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT tournament_id INTO t_id FROM public.team_entries WHERE id = p_entry_id;
  IF t_id IS NULL THEN RAISE EXCEPTION 'Registration not found'; END IF;

  rec := public._admin_ensure_receivable(p_entry_id);
  SELECT to_jsonb(r.*) INTO before_r FROM public.finance_receivables r WHERE r.id = rec.id;

  pay_acc := public._admin_default_payment_account_id(t_id);
  rec_acc := public._admin_receivable_account_id(t_id);
  IF pay_acc IS NULL OR rec_acc IS NULL THEN
    RAISE EXCEPTION 'Tournament finance accounts missing; configure cash/bank/wallet and receivable';
  END IF;

  v_amt := LEAST(p_amount, GREATEST(COALESCE(rec.amount_remaining, 0), 0));
  IF v_amt <= 0 THEN
    RAISE EXCEPTION 'No remaining balance to mark paid';
  END IF;

  note := trim(coalesce(p_notes, ''));
  IF coalesce(trim(p_method), '') <> '' THEN
    note := CASE WHEN note = '' THEN 'method: ' || trim(p_method) ELSE note || E'\nmethod: ' || trim(p_method) END;
  END IF;

  INSERT INTO public.finance_payments (
    tournament_id, receivable_id, team_entry_id, amount, payment_date, account_id, reference, notes, status
  ) VALUES (
    t_id,
    rec.id,
    p_entry_id,
    v_amt,
    now(),
    pay_acc,
    nullif(trim(p_reference), ''),
    nullif(note, ''),
    'posted'
  );

  new_paid := COALESCE(rec.amount_paid, 0) + v_amt;
  new_rem := GREATEST(0, COALESCE(rec.amount_remaining, 0) - v_amt);
  new_st := CASE
    WHEN new_rem <= 0 THEN 'paid'
    WHEN new_paid > 0 THEN 'partial'
    ELSE 'open'
  END;

  UPDATE public.finance_receivables
  SET amount_paid = new_paid, amount_remaining = new_rem, status = new_st, updated_at = now()
  WHERE id = rec.id;

  SELECT to_jsonb(r.*) INTO after_r FROM public.finance_receivables r WHERE r.id = rec.id;

  PERFORM public._platform_admin_audit(
    'registration.mark_paid',
    'registration',
    p_entry_id,
    jsonb_build_object('receivable_before', before_r, 'amount_applied', v_amt),
    jsonb_build_object('receivable_after', after_r),
    nullif(trim(p_reason), '')
  );

  RETURN jsonb_build_object('ok', true, 'receivable', after_r);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_mark_entry_paid(uuid, numeric, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_mark_entry_paid(uuid, numeric, text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_waive_entry_fee(p_entry_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  rec public.finance_receivables;
  before_r jsonb;
  after_r jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  rec := public._admin_ensure_receivable(p_entry_id);
  SELECT to_jsonb(r.*) INTO before_r FROM public.finance_receivables r WHERE r.id = rec.id;

  UPDATE public.finance_receivables
  SET
    amount_waived = COALESCE(amount_waived, 0) + COALESCE(amount_remaining, 0),
    amount_remaining = 0,
    status = 'waived',
    updated_at = now()
  WHERE id = rec.id;

  SELECT to_jsonb(r.*) INTO after_r FROM public.finance_receivables r WHERE r.id = rec.id;

  PERFORM public._platform_admin_audit(
    'registration.waive_fee',
    'registration',
    p_entry_id,
    before_r,
    after_r,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'receivable', after_r);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_waive_entry_fee(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_waive_entry_fee(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_refund_entry(p_entry_id uuid, p_amount numeric, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  rec public.finance_receivables;
  before_r jsonb;
  after_r jsonb;
  v_refund numeric;
  new_paid numeric;
  new_rem numeric;
  new_st text;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Refund amount must be positive';
  END IF;

  SELECT * INTO rec FROM public.finance_receivables r WHERE r.team_entry_id = p_entry_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No receivable for this entry';
  END IF;

  SELECT to_jsonb(r.*) INTO before_r FROM public.finance_receivables r WHERE r.id = rec.id;

  v_refund := LEAST(p_amount, GREATEST(COALESCE(rec.amount_paid, 0), 0));
  IF v_refund <= 0 THEN
    RAISE EXCEPTION 'Nothing to refund';
  END IF;

  new_paid := COALESCE(rec.amount_paid, 0) - v_refund;
  new_rem := GREATEST(0, COALESCE(rec.amount_remaining, 0) + v_refund);
  new_st := CASE
    WHEN new_rem <= 0 AND new_paid + COALESCE(rec.amount_waived, 0) >= COALESCE(rec.amount_due, 0) THEN 'paid'
    WHEN new_paid > 0 THEN 'partial'
    ELSE 'open'
  END;

  UPDATE public.finance_receivables
  SET amount_paid = new_paid, amount_remaining = new_rem, status = new_st, updated_at = now()
  WHERE id = rec.id;

  SELECT to_jsonb(r.*) INTO after_r FROM public.finance_receivables r WHERE r.id = rec.id;

  PERFORM public._platform_admin_audit(
    'registration.refund',
    'registration',
    p_entry_id,
    jsonb_build_object('receivable_before', before_r, 'refund_amount', v_refund),
    jsonb_build_object('receivable_after', after_r),
    nullif(trim(p_reason), '')
  );

  RETURN jsonb_build_object('ok', true, 'receivable', after_r);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_refund_entry(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_refund_entry(uuid, numeric, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_remove_entry(p_entry_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_e jsonb;
  after_e jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT to_jsonb(e.*) INTO before_e FROM public.team_entries e WHERE e.id = p_entry_id;
  IF before_e IS NULL THEN RAISE EXCEPTION 'Registration not found'; END IF;

  UPDATE public.team_entries
  SET status = 'cancelled', reviewed_by = uid, updated_at = now()
  WHERE id = p_entry_id;

  SELECT to_jsonb(e.*) INTO after_e FROM public.team_entries e WHERE e.id = p_entry_id;

  PERFORM public._platform_admin_audit(
    'registration.remove_cancel',
    'registration',
    p_entry_id,
    before_e,
    after_e,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'entry', after_e);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_remove_entry(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_remove_entry(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_update_registration_notes(
  p_entry_id uuid,
  p_notes text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_e jsonb;
  after_e jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT to_jsonb(e.*) INTO before_e FROM public.team_entries e WHERE e.id = p_entry_id;
  IF before_e IS NULL THEN RAISE EXCEPTION 'Registration not found'; END IF;

  UPDATE public.team_entries
  SET admin_notes = p_notes, updated_at = now()
  WHERE id = p_entry_id;

  SELECT to_jsonb(e.*) INTO after_e FROM public.team_entries e WHERE e.id = p_entry_id;

  PERFORM public._platform_admin_audit(
    'registration.notes',
    'registration',
    p_entry_id,
    before_e,
    after_e,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'entry', after_e);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_update_registration_notes(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_update_registration_notes(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_force_add_entry(p_payload jsonb, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  tid uuid;
  tm_id uuid;
  cid uuid;
  st text;
  new_id uuid;
  row_e jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  tid := nullif(trim(p_payload->>'tournament_id'), '')::uuid;
  tm_id := nullif(trim(p_payload->>'team_id'), '')::uuid;
  IF tid IS NULL OR tm_id IS NULL THEN
    RAISE EXCEPTION 'tournament_id and team_id are required';
  END IF;

  cid := nullif(trim(p_payload->>'category_id'), '')::uuid;
  st := coalesce(nullif(trim(p_payload->>'status'), ''), 'pending');
  IF st NOT IN ('pending','approved','rejected') THEN
    st := 'pending';
  END IF;

  INSERT INTO public.team_entries (tournament_id, team_id, status, category_id, reviewed_by)
  VALUES (tid, tm_id, st, cid, CASE WHEN st = 'approved' THEN uid ELSE NULL END)
  RETURNING id INTO new_id;

  SELECT to_jsonb(e.*) INTO row_e FROM public.team_entries e WHERE e.id = new_id;

  PERFORM public._platform_admin_audit(
    'registration.force_add',
    'registration',
    new_id,
    NULL,
    row_e,
    nullif(trim(p_reason), '')
  );

  RETURN jsonb_build_object('ok', true, 'entry', row_e);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_force_add_entry(jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_force_add_entry(jsonb, text) TO authenticated;
