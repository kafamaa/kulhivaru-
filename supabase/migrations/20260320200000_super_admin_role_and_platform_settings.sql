-- Super Admin role, platform_settings, is_super_admin(), sync triggers, RPC role allowances

-- 1) profiles.role includes super_admin (platform owner; not assignable via signup desired_role)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member','organizer','admin','super_admin'));

-- 2) Sync trigger: preserve super_admin / admin / organizer from app_metadata
CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  r := nullif(trim(NEW.raw_app_meta_data->>'role'), '');
  IF r IS NOT NULL AND r NOT IN ('member','organizer','admin','super_admin') THEN
    r := NULL;
  END IF;

  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    coalesce(
      r,
      nullif(trim(NEW.raw_user_meta_data->>'desired_role'), ''),
      'member'
    ),
    nullif(trim(NEW.raw_user_meta_data->>'display_name'), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    role = coalesce(r, profiles.role),
    display_name = coalesce(
      nullif(trim(NEW.raw_user_meta_data->>'display_name'), ''),
      profiles.display_name
    ),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- 3) Signup still cannot pick super_admin (handle_new_user unchanged intent: only member/organizer/admin from desired_role)

-- 4) is_super_admin for RLS / RPC checks
CREATE OR REPLACE FUNCTION public.is_super_admin(check_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = check_uid AND p.role = 'super_admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO service_role;

-- 5) platform_settings (key/value JSON for appearance, flags, etc.)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin all platform_settings" ON public.platform_settings;
CREATE POLICY "Super admin all platform_settings"
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- service_role bypasses RLS for backend jobs
