-- ============================================================
-- KULHIVARU+
-- Initial Core Schema
-- Part 1: User Profile Foundation
-- ============================================================


-- ------------------------------------------------------------
-- PROFILES
-- Application profile for every Supabase Auth user.
-- auth.users remains the authentication source of truth.
-- ------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text,
  display_name text,
  avatar_url text,
  phone text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.profiles enable row level security;


-- The project uses explicit Data API access.
-- Anonymous users receive no access to profiles.

revoke all on table public.profiles from anon, authenticated;

grant select, insert, update
on table public.profiles
to authenticated;


-- ------------------------------------------------------------
-- PROFILE RLS POLICIES
-- A normal user can access only their own profile.
-- ------------------------------------------------------------

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
);


create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
);


create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
)
with check (
  (select auth.uid()) = id
);


-- ------------------------------------------------------------
-- UPDATED_AT
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- CREATE PROFILE AUTOMATICALLY AFTER AUTH SIGNUP
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    display_name,
    avatar_url
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  return new;
end;
$$;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();