-- Fix admin org detail RPC: tournaments table has no updated_at column.
-- Keep response key as updated_at for frontend compatibility.

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
      'updated_at', t.created_at,
      'teams_count', (SELECT COUNT(*)::int FROM public.team_entries te WHERE te.tournament_id = t.id),
      'matches_count', (SELECT COUNT(*)::int FROM public.matches m WHERE m.tournament_id = t.id),
      'revenue', (
        SELECT COALESCE(SUM(r.amount_paid), 0)::numeric(14,2)
        FROM public.finance_receivables r
        WHERE r.tournament_id = t.id
      )
    ) ORDER BY t.created_at DESC NULLS LAST
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
