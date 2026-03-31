-- Platform admin: organizations lifecycle, members rollup, audit log, list/get RPCs.

-- ---------------------------------------------------------------------------
-- 1) Organization columns (governance)
-- ---------------------------------------------------------------------------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS org_status text NOT NULL DEFAULT 'active'
    CHECK (org_status IN ('active','suspended','archived'));

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('verified','unverified','pending'));

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS risk_flag_count int NOT NULL DEFAULT 0;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS allow_finance_module boolean NOT NULL DEFAULT true;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS require_manual_publish_review boolean NOT NULL DEFAULT false;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS max_tournaments int;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS hide_public_visibility boolean NOT NULL DEFAULT false;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS admin_notes text;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS feature_restrictions_json jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 2) Organization members (owner + future invites); backfill owner as member
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, profile_id)
);

CREATE INDEX IF NOT EXISTS organization_members_org_idx ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS organization_members_profile_idx ON public.organization_members(profile_id);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members: self read" ON public.organization_members;
CREATE POLICY "Org members: self read"
  ON public.organization_members FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- Writes via RPC / service role for now
DROP POLICY IF EXISTS "Org members: service all" ON public.organization_members;

INSERT INTO public.organization_members (organization_id, profile_id, role, status)
SELECT o.id, o.owner_id, 'owner', 'active'
FROM public.organizations o
WHERE o.owner_id IS NOT NULL
ON CONFLICT (organization_id, profile_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) is_platform_admin (admin + super_admin) — before RLS policies that reference it
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_platform_admin(check_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = check_uid AND p.role IN ('admin','super_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 4) Immutable audit log for platform admin actions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_admin_audit_log_entity_idx
  ON public.platform_admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS platform_admin_audit_log_created_idx
  ON public.platform_admin_audit_log(created_at DESC);

ALTER TABLE public.platform_admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admin read audit" ON public.platform_admin_audit_log;
CREATE POLICY "Platform admin read audit"
  ON public.platform_admin_audit_log FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 5) Internal: append audit row (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._platform_admin_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_before jsonb,
  p_after jsonb,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.platform_admin_audit_log (
    actor_id, action, entity_type, entity_id, before_json, after_json, reason
  ) VALUES (
    auth.uid(), p_action, p_entity_type, p_entity_id, p_before, p_after, p_reason
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 6) rpc_admin_list_organizations(filters jsonb) -> jsonb { summary, rows }
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_list_organizations(p_filters jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  v_q text;
  v_status text;
  v_verification text;
  v_created_from timestamptz;
  v_created_to timestamptz;
  v_has_tournaments text;
  v_high_risk text;
  result jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;

  v_q := nullif(trim(p_filters->>'q'), '');
  v_status := nullif(trim(p_filters->>'status'), '');
  v_verification := nullif(trim(p_filters->>'verification'), '');
  v_created_from := nullif(p_filters->>'created_from', '')::timestamptz;
  v_created_to := nullif(p_filters->>'created_to', '')::timestamptz;
  v_has_tournaments := nullif(trim(p_filters->>'has_tournaments'), '');
  v_high_risk := nullif(trim(p_filters->>'high_risk'), '');

  WITH base AS (
    SELECT
      o.*,
      (SELECT COUNT(*)::int FROM public.tournaments t WHERE t.organization_id = o.id) AS tournaments_count,
      (
        SELECT COUNT(*)::int FROM public.tournaments t
        WHERE t.organization_id = o.id AND t.status IN ('upcoming','ongoing')
      ) AS active_tournaments_count,
      (SELECT COUNT(*)::int FROM public.organization_members m
       WHERE m.organization_id = o.id AND m.status = 'active') AS members_count,
      (SELECT COALESCE(SUM(r.amount_paid), 0)::numeric(14,2)
       FROM public.finance_receivables r
       INNER JOIN public.tournaments t ON t.id = r.tournament_id
       WHERE t.organization_id = o.id
      ) AS revenue_collected
    FROM public.organizations o
    WHERE
      (v_q IS NULL OR o.name ILIKE '%' || v_q || '%' OR o.slug ILIKE '%' || v_q || '%')
      AND (v_status IS NULL OR o.org_status = v_status)
      AND (v_verification IS NULL OR o.verification_status = v_verification)
      AND (v_created_from IS NULL OR o.created_at >= v_created_from)
      AND (v_created_to IS NULL OR o.created_at < v_created_to + interval '1 day')
      AND (
        v_has_tournaments IS NULL
        OR v_has_tournaments = 'any'
        OR (v_has_tournaments = 'yes' AND EXISTS (
          SELECT 1 FROM public.tournaments t WHERE t.organization_id = o.id
        ))
        OR (v_has_tournaments = 'no' AND NOT EXISTS (
          SELECT 1 FROM public.tournaments t WHERE t.organization_id = o.id
        ))
      )
      AND (
        v_high_risk IS NULL
        OR v_high_risk = 'any'
        OR (v_high_risk = 'yes' AND o.risk_flag_count > 0)
        OR (v_high_risk = 'no' AND o.risk_flag_count = 0)
      )
  ),
  summary AS (
    SELECT jsonb_build_object(
      'total', (SELECT COUNT(*)::int FROM public.organizations),
      'active', (SELECT COUNT(*)::int FROM public.organizations WHERE org_status = 'active'),
      'suspended', (SELECT COUNT(*)::int FROM public.organizations WHERE org_status = 'suspended'),
      'verified', (SELECT COUNT(*)::int FROM public.organizations WHERE verification_status = 'verified'),
      'with_active_tournaments', (
        SELECT COUNT(DISTINCT t.organization_id)::int
        FROM public.tournaments t
        WHERE t.status IN ('upcoming','ongoing')
      )
    ) AS s
  ),
  rows AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'slug', b.slug,
        'owner_id', b.owner_id,
        'created_at', b.created_at,
        'updated_at', b.updated_at,
        'org_status', b.org_status,
        'verification_status', b.verification_status,
        'last_active_at', b.last_active_at,
        'risk_flag_count', b.risk_flag_count,
        'members_count', b.members_count,
        'tournaments_count', b.tournaments_count,
        'active_tournaments_count', b.active_tournaments_count,
        'revenue_collected', b.revenue_collected,
        'owner_display_name', (SELECT pr.display_name FROM public.profiles pr WHERE pr.id = b.owner_id)
      ) ORDER BY b.created_at DESC
    ), '[]'::jsonb) AS r
    FROM base b
  )
  SELECT jsonb_build_object('summary', (SELECT s FROM summary), 'rows', (SELECT r FROM rows))
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_list_organizations(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_list_organizations(jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7) rpc_admin_get_organization(org_id uuid) -> jsonb
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_get_organization(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  o record;
  members jsonb;
  tournaments jsonb;
  audit jsonb;
  revenue numeric(14,2);
  teams_total int;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;

  SELECT * INTO o FROM public.organizations WHERE id = p_org_id LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Organization not found');
  END IF;

  SELECT COALESCE(SUM(r.amount_paid), 0)::numeric(14,2) INTO revenue
  FROM public.finance_receivables r
  INNER JOIN public.tournaments t ON t.id = r.tournament_id
  WHERE t.organization_id = p_org_id;

  SELECT COUNT(DISTINCT te.team_id)::int INTO teams_total
  FROM public.team_entries te
  INNER JOIN public.tournaments t ON t.id = te.tournament_id
  WHERE t.organization_id = p_org_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'profile_id', m.profile_id,
      'role', m.role,
      'member_status', m.status,
      'joined_at', m.joined_at,
      'display_name', p.display_name,
      'platform_role', p.role
    ) ORDER BY m.joined_at
  ), '[]'::jsonb) INTO members
  FROM public.organization_members m
  INNER JOIN public.profiles p ON p.id = m.profile_id
  WHERE m.organization_id = p_org_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'slug', t.slug,
      'status', t.status,
      'sport', t.sport,
      'updated_at', t.updated_at,
      'teams_count', (SELECT COUNT(*)::int FROM public.team_entries te WHERE te.tournament_id = t.id),
      'matches_count', (SELECT COUNT(*)::int FROM public.matches m WHERE m.tournament_id = t.id),
      'revenue', (
        SELECT COALESCE(SUM(r.amount_paid), 0)::numeric(14,2)
        FROM public.finance_receivables r
        WHERE r.tournament_id = t.id
      )
    ) ORDER BY t.updated_at DESC NULLS LAST
  ), '[]'::jsonb) INTO tournaments
  FROM public.tournaments t
  WHERE t.organization_id = p_org_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'action', a.action,
      'created_at', a.created_at,
      'reason', a.reason,
      'before_json', a.before_json,
      'after_json', a.after_json
    ) ORDER BY a.created_at DESC
  ), '[]'::jsonb) INTO audit
  FROM (
    SELECT * FROM public.platform_admin_audit_log
    WHERE entity_type = 'organization' AND entity_id = p_org_id
    ORDER BY created_at DESC
    LIMIT 50
  ) a;

  RETURN jsonb_build_object(
    'ok', true,
    'organization', jsonb_build_object(
      'id', o.id,
      'name', o.name,
      'slug', o.slug,
      'owner_id', o.owner_id,
      'created_at', o.created_at,
      'updated_at', o.updated_at,
      'org_status', o.org_status,
      'verification_status', o.verification_status,
      'last_active_at', o.last_active_at,
      'risk_flag_count', o.risk_flag_count,
      'allow_finance_module', o.allow_finance_module,
      'require_manual_publish_review', o.require_manual_publish_review,
      'max_tournaments', o.max_tournaments,
      'hide_public_visibility', o.hide_public_visibility,
      'admin_notes', o.admin_notes,
      'feature_restrictions_json', o.feature_restrictions_json,
      'members_count', (SELECT COUNT(*)::int FROM organization_members m WHERE m.organization_id = o.id AND m.status = 'active'),
      'tournaments_count', (SELECT COUNT(*)::int FROM tournaments t WHERE t.organization_id = o.id),
      'active_tournaments_count', (
        SELECT COUNT(*)::int FROM tournaments t
        WHERE t.organization_id = o.id AND t.status IN ('upcoming','ongoing')
      ),
      'teams_total', teams_total,
      'revenue_collected', revenue,
      'owner_display_name', (SELECT pr.display_name FROM profiles pr WHERE pr.id = o.owner_id)
    ),
    'members', members,
    'tournaments', tournaments,
    'audit', audit
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_get_organization(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_get_organization(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 8) rpc_admin_update_organization — metadata + governance flags + optional status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_update_organization(
  p_org_id uuid,
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

  SELECT to_jsonb(o.*) INTO before_row FROM public.organizations o WHERE o.id = p_org_id;
  IF before_row IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  UPDATE public.organizations o SET
    name = COALESCE(nullif(trim(p_payload->>'name'), ''), o.name),
    slug = COALESCE(nullif(trim(p_payload->>'slug'), ''), o.slug),
    org_status = CASE WHEN p_payload ? 'org_status' THEN nullif(trim(p_payload->>'org_status'), '')::text ELSE o.org_status END,
    verification_status = CASE WHEN p_payload ? 'verification_status' THEN nullif(trim(p_payload->>'verification_status'), '')::text ELSE o.verification_status END,
    admin_notes = CASE WHEN p_payload ? 'admin_notes' THEN p_payload->>'admin_notes' ELSE o.admin_notes END,
    allow_finance_module = CASE WHEN p_payload ? 'allow_finance_module' THEN (p_payload->>'allow_finance_module')::boolean ELSE o.allow_finance_module END,
    require_manual_publish_review = CASE WHEN p_payload ? 'require_manual_publish_review' THEN (p_payload->>'require_manual_publish_review')::boolean ELSE o.require_manual_publish_review END,
    max_tournaments = CASE
      WHEN p_payload ? 'max_tournaments' AND (p_payload->>'max_tournaments') = '' THEN NULL
      WHEN p_payload ? 'max_tournaments' THEN (p_payload->>'max_tournaments')::int
      ELSE o.max_tournaments
    END,
    hide_public_visibility = CASE WHEN p_payload ? 'hide_public_visibility' THEN (p_payload->>'hide_public_visibility')::boolean ELSE o.hide_public_visibility END,
    risk_flag_count = CASE WHEN p_payload ? 'risk_flag_count' THEN (p_payload->>'risk_flag_count')::int ELSE o.risk_flag_count END,
    feature_restrictions_json = COALESCE(p_payload->'feature_restrictions_json', o.feature_restrictions_json),
    updated_at = now()
  WHERE o.id = p_org_id;

  SELECT to_jsonb(o.*) INTO after_row FROM public.organizations o WHERE o.id = p_org_id;

  PERFORM public._platform_admin_audit(
    'organization.update',
    'organization',
    p_org_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );

  RETURN jsonb_build_object('ok', true, 'organization', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_update_organization(uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_update_organization(uuid, jsonb, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 9) rpc_admin_set_organization_status — suspend / activate / archive
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_set_organization_status(
  p_org_id uuid,
  p_status text,
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

  IF p_status NOT IN ('active','suspended','archived') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  IF nullif(trim(p_reason), '') IS NULL AND p_status IN ('suspended','archived') THEN
    RAISE EXCEPTION 'Reason is required for this status change';
  END IF;

  SELECT to_jsonb(o.*) INTO before_row FROM public.organizations o WHERE o.id = p_org_id;
  IF before_row IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  UPDATE public.organizations SET org_status = p_status, updated_at = now() WHERE id = p_org_id;
  SELECT to_jsonb(o.*) INTO after_row FROM public.organizations o WHERE o.id = p_org_id;

  PERFORM public._platform_admin_audit(
    'organization.status.' || p_status,
    'organization',
    p_org_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );

  RETURN jsonb_build_object('ok', true, 'organization', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_set_organization_status(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_set_organization_status(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 10) rpc_admin_create_organization — bootstrap org (optional owner)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_create_organization(
  p_name text,
  p_slug text,
  p_owner_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  new_id uuid;
  clean_slug text;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;

  IF length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;

  clean_slug := nullif(trim(p_slug), '');
  IF clean_slug IS NULL THEN
    clean_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g'));
    clean_slug := trim(both '-' from clean_slug);
  END IF;
  IF clean_slug = '' THEN
    clean_slug := 'organization-' || substr(gen_random_uuid()::text, 1, 8);
  END IF;

  INSERT INTO public.organizations (name, slug, owner_id)
  VALUES (trim(p_name), clean_slug, p_owner_id)
  RETURNING id INTO new_id;

  IF p_owner_id IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, profile_id, role, status)
    VALUES (new_id, p_owner_id, 'owner', 'active')
    ON CONFLICT (organization_id, profile_id) DO NOTHING;
  END IF;

  PERFORM public._platform_admin_audit(
    'organization.create',
    'organization',
    new_id,
    NULL,
    to_jsonb((SELECT o FROM public.organizations o WHERE o.id = new_id)),
    nullif(trim(p_reason), '')
  );

  RETURN jsonb_build_object('ok', true, 'id', new_id, 'slug', clean_slug);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_create_organization(text, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_create_organization(text, text, uuid, text) TO authenticated;
