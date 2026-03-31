-- Connect auth.users with public.profiles:
-- 1. Create profile on signup (trigger on auth.users INSERT)
-- 2. Sync role and display_name when auth.users changes (trigger on UPDATE)
-- 3. RLS so users can read/update their own profile
-- 4. Backfill existing users into profiles

-- Ensure profiles table exists (you may have created it manually)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','organizer','admin')),
  display_name text,
  updated_at timestamptz DEFAULT now()
);

-- Function: create or update profile from auth.users (INSERT)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  r := coalesce(
    nullif(trim(NEW.raw_user_meta_data->>'desired_role'), ''),
    'member'
  );
  IF r NOT IN ('member','organizer','admin') THEN
    r := 'member';
  END IF;
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    r,
    nullif(trim(NEW.raw_user_meta_data->>'display_name'), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    display_name = coalesce(nullif(trim(EXCLUDED.display_name), ''), profiles.display_name),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: sync profile when auth.users is updated (e.g. app_metadata.role)
CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
BEGIN
  r := coalesce(
    nullif(trim(NEW.raw_app_meta_data->>'role'), ''),
    'member'
  );
  IF r NOT IN ('member','organizer','admin') THEN
    r := 'member';
  END IF;
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    r,
    nullif(trim(NEW.raw_user_meta_data->>'display_name'), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    role = r,
    display_name = coalesce(nullif(trim(NEW.raw_user_meta_data->>'display_name'), ''), profiles.display_name),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger: after insert on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: after update on auth.users (sync role from app_metadata, display_name from user_metadata)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_updated();

-- RLS: users can read and update their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow insert only via trigger (service role / definer), not by arbitrary users
-- So we do not add a policy for INSERT; the trigger runs as SECURITY DEFINER.

-- Backfill: ensure every existing auth.user has a profile row
INSERT INTO public.profiles (id, role, display_name)
SELECT
  u.id,
  coalesce(
    CASE
      WHEN (u.raw_app_meta_data->>'role') IN ('member','organizer','admin')
      THEN u.raw_app_meta_data->>'role'
      ELSE 'member'
    END,
    CASE
      WHEN (u.raw_user_meta_data->>'desired_role') IN ('member','organizer','admin')
      THEN u.raw_user_meta_data->>'desired_role'
      ELSE 'member'
    END,
    'member'
  ),
  nullif(trim(u.raw_user_meta_data->>'display_name'), '')
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  role = coalesce(
    nullif(EXCLUDED.role, ''),
    profiles.role
  ),
  display_name = coalesce(nullif(trim(EXCLUDED.display_name), ''), profiles.display_name),
  updated_at = now();
