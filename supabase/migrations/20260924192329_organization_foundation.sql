-- ============================================================
-- KULHIVARU+
-- Organization Foundation
-- Part 1: Organizations + Organization Members
-- ============================================================


-- ------------------------------------------------------------
-- ORGANIZATIONS
-- Legal / operational owner of tournaments.
-- ------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null,
  description text,
  logo_url text,

  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),

  created_by uuid not null
    references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organizations_name_not_blank
    check (char_length(trim(name)) > 0),

  constraint organizations_slug_not_blank
    check (char_length(trim(slug)) > 0),

  constraint organizations_slug_unique
    unique (slug)
);


-- ------------------------------------------------------------
-- ORGANIZATION MEMBERS
-- Connects authenticated users to organizations.
-- ------------------------------------------------------------

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  role text not null
    check (role in ('owner', 'admin', 'manager')),

  status text not null default 'active'
    check (status in ('active', 'inactive')),

  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organization_members_user_unique
    unique (organization_id, user_id)
);


-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------

create index organization_members_user_id_idx
on public.organization_members(user_id);

create index organization_members_organization_id_idx
on public.organization_members(organization_id);

create index organizations_created_by_idx
on public.organizations(created_by);


-- ------------------------------------------------------------
-- UPDATED_AT TRIGGERS
-- Reuse set_updated_at() created by the first migration.
-- ------------------------------------------------------------

create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();


create trigger organization_members_set_updated_at
before update on public.organization_members
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Policies will be added after the membership authorization
-- design is created and tested.
-- ------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;


-- ------------------------------------------------------------
-- DATA API PRIVILEGES
-- No access is granted yet.
-- RLS policies + grants will be added together in the next part.
-- ------------------------------------------------------------

revoke all on table public.organizations
from anon, authenticated;

revoke all on table public.organization_members
from anon, authenticated;
-- ============================================================
-- ORGANIZATION AUTHORIZATION
-- ============================================================


-- ------------------------------------------------------------
-- MEMBERSHIP AUTHORIZATION HELPER
--
-- SECURITY DEFINER allows this function to inspect membership
-- without causing recursive organization_members RLS policies.
-- It returns true only for an ACTIVE membership.
-- ------------------------------------------------------------

create or replace function public.is_organization_member(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
  );
$$;


-- ------------------------------------------------------------
-- ORGANIZATION ROLE AUTHORIZATION HELPER
-- ------------------------------------------------------------

create or replace function public.has_organization_role(
  target_organization_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
      and om.role = any(allowed_roles)
  );
$$;


-- ------------------------------------------------------------
-- LOCK DOWN AUTHORIZATION HELPERS
-- ------------------------------------------------------------

revoke all
on function public.is_organization_member(uuid)
from public;

revoke all
on function public.has_organization_role(uuid, text[])
from public;

grant execute
on function public.is_organization_member(uuid)
to authenticated;

grant execute
on function public.has_organization_role(uuid, text[])
to authenticated;


-- ------------------------------------------------------------
-- DATA API PRIVILEGES
-- RLS still determines which rows are actually accessible.
-- ------------------------------------------------------------

grant select
on table public.organizations
to authenticated;

grant select
on table public.organization_members
to authenticated;


-- ------------------------------------------------------------
-- ORGANIZATIONS — SELECT
--
-- Active members may read their organization.
-- ------------------------------------------------------------

create policy "organizations_select_member"
on public.organizations
for select
to authenticated
using (
  public.is_organization_member(id)
);


-- ------------------------------------------------------------
-- ORGANIZATION MEMBERS — SELECT
--
-- Active members may see members belonging to their own
-- organization.
-- ------------------------------------------------------------

create policy "organization_members_select_member"
on public.organization_members
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);
-- ============================================================
-- CREATE ORGANIZATION ATOMICALLY
-- Creates the organization and its first OWNER membership
-- in the same database transaction.
-- ============================================================

create or replace function public.create_organization(
  organization_name text,
  organization_slug text,
  organization_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  new_organization_id uuid;
  clean_name text;
  clean_slug text;
begin

  -- ----------------------------------------------------------
  -- AUTHENTICATION
  -- ----------------------------------------------------------

  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;


  -- ----------------------------------------------------------
  -- INPUT NORMALIZATION
  -- ----------------------------------------------------------

  clean_name := trim(organization_name);
  clean_slug := lower(trim(organization_slug));


  -- ----------------------------------------------------------
  -- VALIDATION
  -- ----------------------------------------------------------

  if clean_name is null or clean_name = '' then
    raise exception 'Organization name is required';
  end if;

  if char_length(clean_name) > 120 then
    raise exception 'Organization name is too long';
  end if;

  if clean_slug is null or clean_slug = '' then
    raise exception 'Organization slug is required';
  end if;

  if char_length(clean_slug) > 80 then
    raise exception 'Organization slug is too long';
  end if;

  if clean_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception
      'Organization slug may contain lowercase letters, numbers and single hyphens only';
  end if;


  -- ----------------------------------------------------------
  -- CREATE ORGANIZATION
  -- ----------------------------------------------------------

  insert into public.organizations (
    name,
    slug,
    description,
    created_by
  )
  values (
    clean_name,
    clean_slug,
    nullif(trim(organization_description), ''),
    current_user_id
  )
  returning id into new_organization_id;


  -- ----------------------------------------------------------
  -- CREATE INITIAL OWNER MEMBERSHIP
  -- ----------------------------------------------------------

  insert into public.organization_members (
    organization_id,
    user_id,
    role,
    status
  )
  values (
    new_organization_id,
    current_user_id,
    'owner',
    'active'
  );


  -- ----------------------------------------------------------
  -- RETURN NEW ORGANIZATION
  -- ----------------------------------------------------------

  return new_organization_id;

end;
$$;


-- ------------------------------------------------------------
-- FUNCTION SECURITY
-- ------------------------------------------------------------

revoke all
on function public.create_organization(text, text, text)
from public;

grant execute
on function public.create_organization(text, text, text)
to authenticated;