-- Platform admin: global user management — profile governance, list/get RPCs, audit-backed actions.

-- ---------------------------------------------------------------------------
-- 1) Profile governance (platform account status + admin fields)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active';

UPDATE public.profiles SET account_status = 'active' WHERE account_status IS NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active','suspended','invited','archived'));

ALTER TABLE public.profiles ALTER COLUMN account_status SET NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_notes text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS risk_flag_count int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS profiles_account_status_idx ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- ---------------------------------------------------------------------------
-- 2) rpc_admin_list_users(filters jsonb) -> { summary, rows }
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_list_users(p_filters jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid;
  v_q text;
  v_role text;
  v_status text;
  v_email_verified text;
  v_has_orgs text;
  v_flagged text;
  v_created_from timestamptz;
  v_created_to timestamptz;
  v_login_from timestamptz;
  v_login_to timestamptz;
  v_recent_only text;
  v_limit int;
  result jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;

  v_q := nullif(trim(p_filters->>'q'), '');
  v_role := nullif(lower(trim(p_filters->>'role')), '');
  v_status := nullif(lower(trim(p_filters->>'status')), '');
  v_email_verified := nullif(lower(trim(p_filters->>'email_verified')), '');
  v_has_orgs := nullif(lower(trim(p_filters->>'has_orgs')), '');
  v_flagged := nullif(lower(trim(p_filters->>'flagged')), '');
  v_recent_only := nullif(lower(trim(p_filters->>'recent_created')), '');
  v_created_from := nullif(trim(p_filters->>'created_from'), '')::timestamptz;
  v_created_to := nullif(trim(p_filters->>'created_to'), '')::timestamptz;
  v_login_from := nullif(trim(p_filters->>'last_login_from'), '')::timestamptz;
  v_login_to := nullif(trim(p_filters->>'last_login_to'), '')::timestamptz;

  v_limit := COALESCE(NULLIF(trim(p_filters->>'limit'), '')::int, 200);
  IF v_limit < 1 THEN v_limit := 1; END IF;
  IF v_limit > 500 THEN v_limit := 500; END IF;

  WITH base AS (
    SELECT
      p.*,
      u.email::text AS email,
      u.created_at AS user_created_at,
      u.last_sign_in_at,
      (u.email_confirmed_at IS NOT NULL) AS email_verified,
      COALESCE(u.phone, nullif(trim(u.raw_user_meta_data->>'phone'), ''))::text AS phone,
      (
        SELECT COUNT(DISTINCT x.oid)::int
        FROM (
          SELECT om.organization_id AS oid
          FROM public.organization_members om
          WHERE om.profile_id = p.id AND om.status = 'active'
          UNION
          SELECT o.id FROM public.organizations o WHERE o.owner_id = p.id
        ) x
      ) AS org_count,
      (
        SELECT COUNT(DISTINCT t.id)::int
        FROM public.tournaments t
        WHERE t.organization_id IN (
          SELECT om.organization_id
          FROM public.organization_members om
          WHERE om.profile_id = p.id AND om.status = 'active'
          UNION
          SELECT o.id FROM public.organizations o WHERE o.owner_id = p.id
        )
      ) AS tournament_touch_count,
      (
        (CASE WHEN u.email_confirmed_at IS NULL THEN 1 ELSE 0 END)
        + (CASE WHEN p.risk_flag_count > 0 THEN 1 ELSE 0 END)
        + (CASE
          WHEN p.account_status = 'suspended' AND EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.owner_id = p.id
              AND EXISTS (
                SELECT 1 FROM public.tournaments t
                WHERE t.organization_id = o.id AND t.status IN ('upcoming','ongoing')
              )
          ) THEN 1 ELSE 0 END)
      )::int AS issue_count
    FROM public.profiles p
    INNER JOIN auth.users u ON u.id = p.id
  ),
  filtered AS (
    SELECT * FROM base b
    WHERE
      (v_q IS NULL OR COALESCE(b.display_name, '') ILIKE '%' || v_q || '%' OR b.email ILIKE '%' || v_q || '%')
      AND (v_role IS NULL OR b.role = v_role)
      AND (v_status IS NULL OR b.account_status = v_status)
      AND (
        v_email_verified IS NULL
        OR v_email_verified = 'any'
        OR (v_email_verified = 'yes' AND b.email_verified = true)
        OR (v_email_verified = 'no' AND b.email_verified = false)
      )
      AND (
        v_has_orgs IS NULL
        OR v_has_orgs = 'any'
        OR (v_has_orgs = 'yes' AND b.org_count > 0)
        OR (v_has_orgs = 'no' AND b.org_count = 0)
      )
      AND (
        v_flagged IS NULL
        OR v_flagged = 'any'
        OR (v_flagged = 'yes' AND b.risk_flag_count > 0)
        OR (v_flagged = 'no' AND b.risk_flag_count = 0)
      )
      AND (v_created_from IS NULL OR b.user_created_at >= v_created_from)
      AND (v_created_to IS NULL OR b.user_created_at < v_created_to + interval '1 day')
      AND (v_login_from IS NULL OR (b.last_sign_in_at IS NOT NULL AND b.last_sign_in_at >= v_login_from))
      AND (v_login_to IS NULL OR (b.last_sign_in_at IS NOT NULL AND b.last_sign_in_at <= v_login_to))
      AND (
        v_recent_only IS NULL
        OR v_recent_only <> 'yes'
        OR b.user_created_at >= (now() - interval '7 days')
      )
  ),
  summary AS (
    SELECT jsonb_build_object(
      'total', (SELECT COUNT(*)::int FROM public.profiles),
      'active', (SELECT COUNT(*)::int FROM public.profiles WHERE account_status = 'active'),
      'suspended', (SELECT COUNT(*)::int FROM public.profiles WHERE account_status = 'suspended'),
      'organizers', (SELECT COUNT(*)::int FROM public.profiles WHERE role = 'organizer'),
      'super_admins', (SELECT COUNT(*)::int FROM public.profiles WHERE role = 'super_admin'),
      'recently_joined', (
        SELECT COUNT(*)::int
        FROM public.profiles p2
        INNER JOIN auth.users u2 ON u2.id = p2.id
        WHERE u2.created_at >= now() - interval '7 days'
      ),
      'never_logged_in', (
        SELECT COUNT(*)::int
        FROM public.profiles p2
        INNER JOIN auth.users u2 ON u2.id = p2.id
        WHERE u2.last_sign_in_at IS NULL
      ),
      'flagged', (SELECT COUNT(*)::int FROM public.profiles WHERE risk_flag_count > 0)
    ) AS s
  ),
  rows AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', f.id,
        'display_name', f.display_name,
        'email', f.email,
        'phone', f.phone,
        'role', f.role,
        'account_status', f.account_status,
        'email_verified', f.email_verified,
        'org_count', f.org_count,
        'tournament_touch_count', f.tournament_touch_count,
        'risk_flag_count', f.risk_flag_count,
        'issue_count', f.issue_count,
        'last_sign_in_at', f.last_sign_in_at,
        'created_at', f.user_created_at,
        'updated_at', f.updated_at
      ) ORDER BY f.user_created_at DESC
    ), '[]'::jsonb) AS r
    FROM (SELECT * FROM filtered ORDER BY user_created_at DESC LIMIT v_limit) f
  )
  SELECT jsonb_build_object('summary', (SELECT s FROM summary), 'rows', (SELECT r FROM rows))
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_list_users(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_list_users(jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) rpc_admin_get_user(user_id uuid) -> jsonb
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_get_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid;
  prof record;
  uemail text;
  ucreated timestamptz;
  ulast timestamptz;
  everified boolean;
  uphone text;
  memberships jsonb;
  tournaments jsonb;
  audit_target jsonb;
  audit_actor jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;

  SELECT p.* INTO prof FROM public.profiles p WHERE p.id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  SELECT
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    (u.email_confirmed_at IS NOT NULL),
    COALESCE(u.phone, nullif(trim(u.raw_user_meta_data->>'phone'), ''))::text
  INTO uemail, ucreated, ulast, everified, uphone
  FROM auth.users u WHERE u.id = p_user_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'organization_id', o.id,
      'organization_name', o.name,
      'organization_slug', o.slug,
      'org_role', m.role,
      'member_status', m.status,
      'joined_at', m.joined_at,
      'is_owner', (o.owner_id = p_user_id)
    ) ORDER BY m.joined_at DESC NULLS LAST
  ), '[]'::jsonb) INTO memberships
  FROM public.organization_members m
  INNER JOIN public.organizations o ON o.id = m.organization_id
  WHERE m.profile_id = p_user_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'tournament_id', t.id,
      'tournament_name', t.name,
      'tournament_slug', t.slug,
      'tournament_status', t.status,
      'organization_id', t.organization_id,
      'organization_name', o.name,
      'connection', 'organization'
    ) ORDER BY t.created_at DESC NULLS LAST
  ), '[]'::jsonb) INTO tournaments
  FROM public.tournaments t
  INNER JOIN public.organizations o ON o.id = t.organization_id
  WHERE t.organization_id IN (
    SELECT om.organization_id FROM public.organization_members om
    WHERE om.profile_id = p_user_id AND om.status = 'active'
    UNION
    SELECT o2.id FROM public.organizations o2 WHERE o2.owner_id = p_user_id
  );

  SELECT COALESCE(jsonb_agg(x.entry ORDER BY x.created_at DESC), '[]'::jsonb) INTO audit_target
  FROM (
    SELECT
      l.created_at,
      jsonb_build_object(
        'id', l.id,
        'action', l.action,
        'created_at', l.created_at,
        'reason', l.reason,
        'actor_id', l.actor_id,
        'entity_type', l.entity_type,
        'entity_id', l.entity_id,
        'before_json', l.before_json,
        'after_json', l.after_json
      ) AS entry
    FROM public.platform_admin_audit_log l
    WHERE l.entity_type = 'user' AND l.entity_id = p_user_id
    ORDER BY l.created_at DESC
    LIMIT 80
  ) x;

  SELECT COALESCE(jsonb_agg(x.entry ORDER BY x.created_at DESC), '[]'::jsonb) INTO audit_actor
  FROM (
    SELECT
      l.created_at,
      jsonb_build_object(
        'id', l.id,
        'action', l.action,
        'created_at', l.created_at,
        'reason', l.reason,
        'entity_type', l.entity_type,
        'entity_id', l.entity_id
      ) AS entry
    FROM public.platform_admin_audit_log l
    WHERE l.actor_id = p_user_id
    ORDER BY l.created_at DESC
    LIMIT 80
  ) x;

  RETURN jsonb_build_object(
    'profile', to_jsonb(prof),
    'auth', jsonb_build_object(
      'email', uemail,
      'phone', uphone,
      'email_verified', everified,
      'created_at', ucreated,
      'last_sign_in_at', ulast
    ),
    'memberships', memberships,
    'tournaments', tournaments,
    'audit_as_target', audit_target,
    'audit_as_actor', audit_actor
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_get_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_get_user(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) Action RPCs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_admin_suspend_user(p_user_id uuid, p_reason text)
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
  IF p_user_id = uid THEN
    RAISE EXCEPTION 'Cannot suspend your own account';
  END IF;

  SELECT to_jsonb(p.*) INTO before_row FROM public.profiles p WHERE p.id = p_user_id;
  IF before_row IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  UPDATE public.profiles SET account_status = 'suspended', updated_at = now() WHERE id = p_user_id;
  SELECT to_jsonb(p.*) INTO after_row FROM public.profiles p WHERE p.id = p_user_id;

  PERFORM public._platform_admin_audit(
    'user.suspend',
    'user',
    p_user_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'profile', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_suspend_user(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_suspend_user(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_activate_user(p_user_id uuid, p_reason text)
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

  SELECT to_jsonb(p.*) INTO before_row FROM public.profiles p WHERE p.id = p_user_id;
  IF before_row IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  UPDATE public.profiles SET account_status = 'active', updated_at = now() WHERE id = p_user_id;
  SELECT to_jsonb(p.*) INTO after_row FROM public.profiles p WHERE p.id = p_user_id;

  PERFORM public._platform_admin_audit(
    'user.activate',
    'user',
    p_user_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'profile', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_activate_user(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_activate_user(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_archive_user(p_user_id uuid, p_reason text)
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
  IF p_user_id = uid THEN
    RAISE EXCEPTION 'Cannot archive your own account';
  END IF;

  SELECT to_jsonb(p.*) INTO before_row FROM public.profiles p WHERE p.id = p_user_id;
  IF before_row IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  UPDATE public.profiles SET account_status = 'archived', updated_at = now() WHERE id = p_user_id;
  SELECT to_jsonb(p.*) INTO after_row FROM public.profiles p WHERE p.id = p_user_id;

  PERFORM public._platform_admin_audit(
    'user.archive',
    'user',
    p_user_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'profile', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_archive_user(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_archive_user(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_set_user_role(p_user_id uuid, p_role text, p_reason text)
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
  IF p_user_id = uid THEN
    RAISE EXCEPTION 'Cannot change your own platform role via admin';
  END IF;
  IF p_role IS NULL OR p_role NOT IN ('member','organizer','admin','super_admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  SELECT to_jsonb(p.*) INTO before_row FROM public.profiles p WHERE p.id = p_user_id;
  IF before_row IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  UPDATE public.profiles SET role = p_role, updated_at = now() WHERE id = p_user_id;
  SELECT to_jsonb(p.*) INTO after_row FROM public.profiles p WHERE p.id = p_user_id;

  PERFORM public._platform_admin_audit(
    'user.role.set',
    'user',
    p_user_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'profile', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_set_user_role(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_set_user_role(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_revoke_org_access(p_user_id uuid, p_org_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  before_row jsonb;
BEGIN
  uid := auth.uid();
  IF uid IS NULL OR NOT public.is_platform_admin(uid) THEN
    RAISE EXCEPTION 'Platform admin required';
  END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT to_jsonb(m.*) INTO before_row
  FROM public.organization_members m
  WHERE m.organization_id = p_org_id AND m.profile_id = p_user_id;
  IF before_row IS NULL THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  DELETE FROM public.organization_members
  WHERE organization_id = p_org_id AND profile_id = p_user_id;

  PERFORM public._platform_admin_audit(
    'user.org.revoke',
    'user',
    p_user_id,
    before_row,
    jsonb_build_object('organization_id', p_org_id, 'removed', true),
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_revoke_org_access(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_revoke_org_access(uuid, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_update_user(p_user_id uuid, p_payload jsonb, p_reason text)
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

  SELECT to_jsonb(p.*) INTO before_row FROM public.profiles p WHERE p.id = p_user_id;
  IF before_row IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  UPDATE public.profiles pr SET
    display_name = CASE
      WHEN p_payload ? 'display_name' THEN nullif(trim(p_payload->>'display_name'), '')
      ELSE pr.display_name
    END,
    admin_notes = CASE WHEN p_payload ? 'admin_notes' THEN p_payload->>'admin_notes' ELSE pr.admin_notes END,
    risk_flag_count = CASE
      WHEN p_payload ? 'risk_flag_count' THEN (p_payload->>'risk_flag_count')::int
      ELSE pr.risk_flag_count
    END,
    updated_at = now()
  WHERE pr.id = p_user_id;

  SELECT to_jsonb(p.*) INTO after_row FROM public.profiles p WHERE p.id = p_user_id;

  PERFORM public._platform_admin_audit(
    'user.update',
    'user',
    p_user_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'profile', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_update_user(uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_update_user(uuid, jsonb, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_set_org_member_status(
  p_user_id uuid,
  p_org_id uuid,
  p_member_status text,
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
  IF p_member_status NOT IN ('active','suspended') THEN
    RAISE EXCEPTION 'Invalid membership status';
  END IF;

  SELECT to_jsonb(m.*) INTO before_row
  FROM public.organization_members m
  WHERE m.organization_id = p_org_id AND m.profile_id = p_user_id;
  IF before_row IS NULL THEN RAISE EXCEPTION 'Membership not found'; END IF;

  UPDATE public.organization_members
  SET status = p_member_status
  WHERE organization_id = p_org_id AND profile_id = p_user_id;

  SELECT to_jsonb(m.*) INTO after_row
  FROM public.organization_members m
  WHERE m.organization_id = p_org_id AND m.profile_id = p_user_id;

  PERFORM public._platform_admin_audit(
    'user.org_member.status',
    'user',
    p_user_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'membership', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_set_org_member_status(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_set_org_member_status(uuid, uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_admin_set_org_member_role(
  p_user_id uuid,
  p_org_id uuid,
  p_org_role text,
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
  IF p_org_role NOT IN ('owner','admin','member') THEN
    RAISE EXCEPTION 'Invalid org role';
  END IF;

  SELECT to_jsonb(m.*) INTO before_row
  FROM public.organization_members m
  WHERE m.organization_id = p_org_id AND m.profile_id = p_user_id;
  IF before_row IS NULL THEN RAISE EXCEPTION 'Membership not found'; END IF;

  UPDATE public.organization_members
  SET role = p_org_role
  WHERE organization_id = p_org_id AND profile_id = p_user_id;

  SELECT to_jsonb(m.*) INTO after_row
  FROM public.organization_members m
  WHERE m.organization_id = p_org_id AND m.profile_id = p_user_id;

  PERFORM public._platform_admin_audit(
    'user.org_member.role',
    'user',
    p_user_id,
    before_row,
    after_row,
    nullif(trim(p_reason), '')
  );
  RETURN jsonb_build_object('ok', true, 'membership', after_row);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_set_org_member_role(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_admin_set_org_member_role(uuid, uuid, text, text) TO authenticated;
