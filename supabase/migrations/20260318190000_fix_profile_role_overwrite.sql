-- Fix: prevent auth.users UPDATE trigger from overwriting profiles.role to 'member'
-- When auth.users changes (confirm email, etc.), raw_app_meta_data.role is often empty.
-- We should preserve the current profiles.role unless a valid app_metadata.role exists.

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
  IF r IS NOT NULL AND r NOT IN ('member','organizer','admin') THEN
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

