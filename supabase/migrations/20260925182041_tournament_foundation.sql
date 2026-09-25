-- ============================================================
-- KULHIVARU+
-- TOURNAMENT FOUNDATION
-- ============================================================
--
-- Core tournament domain.
--
-- Existing foundation:
--   public.organizations
--   public.organization_members
--   public.is_organization_member(uuid)
--   public.has_organization_role(uuid, text[])
--
-- Principles:
--   - multi-sport architecture
--   - tournaments belong to organizations
--   - competition configuration is data-driven
--   - organization authorization remains resource scoped
--   - later migrations add permanent teams/players, stages,
--     registrations, fixtures, matches, events and statistics
-- ============================================================


-- ============================================================
-- 1. SPORTS
-- ============================================================

create table public.sports (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null,

  status text not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sports_name_not_blank
    check (length(trim(name)) > 0),

  constraint sports_slug_not_blank
    check (length(trim(slug)) > 0),

  constraint sports_slug_unique
    unique (slug),

  constraint sports_status_check
    check (
      status in (
        'active',
        'inactive'
      )
    )
);


create index sports_status_idx
on public.sports(status);


-- ============================================================
-- 2. TOURNAMENTS
-- ============================================================

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  sport_id uuid not null
    references public.sports(id)
    on delete restrict,

  name text not null,
  slug text not null,

  description text,

  logo_url text,
  cover_url text,

  season_label text,

  start_date date,
  end_date date,

  registration_opens_at timestamptz,
  registration_closes_at timestamptz,

  timezone text not null default 'Indian/Maldives',

  visibility text not null default 'private',

  status text not null default 'draft',

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tournaments_name_not_blank
    check (length(trim(name)) > 0),

  constraint tournaments_name_length
    check (char_length(name) <= 160),

  constraint tournaments_slug_not_blank
    check (length(trim(slug)) > 0),

  constraint tournaments_slug_format
    check (
      slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),

  constraint tournaments_visibility_check
    check (
      visibility in (
        'private',
        'unlisted',
        'public'
      )
    ),

  constraint tournaments_status_check
    check (
      status in (
        'draft',
        'registration',
        'scheduled',
        'live',
        'completed',
        'cancelled',
        'archived'
      )
    ),

  constraint tournaments_dates_check
    check (
      start_date is null
      or end_date is null
      or end_date >= start_date
    ),

  constraint tournaments_registration_dates_check
    check (
      registration_opens_at is null
      or registration_closes_at is null
      or registration_closes_at >= registration_opens_at
    ),

  constraint tournaments_organization_slug_unique
    unique (
      organization_id,
      slug
    )
);


create index tournaments_organization_idx
on public.tournaments(organization_id);


create index tournaments_sport_idx
on public.tournaments(sport_id);


create index tournaments_status_idx
on public.tournaments(status);


create index tournaments_organization_status_idx
on public.tournaments(
  organization_id,
  status
);


create index tournaments_start_date_idx
on public.tournaments(start_date);


create index tournaments_created_at_idx
on public.tournaments(created_at desc);


-- ============================================================
-- 3. TOURNAMENT SETTINGS
-- ============================================================
--
-- Settings intentionally remain flexible.
-- Sport/competition-specific rules will be expanded by later
-- competition-engine migrations rather than hard-coded here.
-- ============================================================

create table public.tournament_settings (
  tournament_id uuid primary key
    references public.tournaments(id)
    on delete cascade,

  points_for_win numeric(8, 3) not null default 3,
  points_for_draw numeric(8, 3) not null default 1,
  points_for_loss numeric(8, 3) not null default 0,

  allow_draws boolean not null default true,

  extra_time_enabled boolean not null default false,
  penalties_enabled boolean not null default false,

  match_duration_minutes integer,

  period_count integer,

  squad_min integer,
  squad_max integer,

  lineup_min integer,
  lineup_max integer,

  substitutions_max integer,

  rules jsonb not null default '{}'::jsonb,

  tie_breakers jsonb not null default
    '[
      "points",
      "goal_difference",
      "goals_for"
    ]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tournament_settings_points_win_check
    check (points_for_win >= 0),

  constraint tournament_settings_points_draw_check
    check (points_for_draw >= 0),

  constraint tournament_settings_points_loss_check
    check (points_for_loss >= 0),

  constraint tournament_settings_match_duration_check
    check (
      match_duration_minutes is null
      or match_duration_minutes > 0
    ),

  constraint tournament_settings_period_count_check
    check (
      period_count is null
      or period_count > 0
    ),

  constraint tournament_settings_squad_min_check
    check (
      squad_min is null
      or squad_min >= 0
    ),

  constraint tournament_settings_squad_max_check
    check (
      squad_max is null
      or squad_max > 0
    ),

  constraint tournament_settings_squad_range_check
    check (
      squad_min is null
      or squad_max is null
      or squad_max >= squad_min
    ),

  constraint tournament_settings_lineup_min_check
    check (
      lineup_min is null
      or lineup_min >= 0
    ),

  constraint tournament_settings_lineup_max_check
    check (
      lineup_max is null
      or lineup_max > 0
    ),

  constraint tournament_settings_lineup_range_check
    check (
      lineup_min is null
      or lineup_max is null
      or lineup_max >= lineup_min
    ),

  constraint tournament_settings_substitutions_check
    check (
      substitutions_max is null
      or substitutions_max >= 0
    ),

  constraint tournament_settings_rules_object
    check (
      jsonb_typeof(rules) = 'object'
    ),

  constraint tournament_settings_tie_breakers_array
    check (
      jsonb_typeof(tie_breakers) = 'array'
    )
);


-- ============================================================
-- 4. TOURNAMENT MEMBERS / RESOURCE-SCOPED ACCESS
-- ============================================================
--
-- Organization role alone must not become the only long-term
-- authorization mechanism for tournament resources.
--
-- This table provides explicit tournament assignments that can
-- later support tournament administrators, operators, officials
-- and other resource-scoped permissions.
-- ============================================================

create table public.tournament_members (
  id uuid primary key default gen_random_uuid(),

  tournament_id uuid not null
    references public.tournaments(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  role text not null,

  status text not null default 'active',

  assigned_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tournament_members_role_check
    check (
      role in (
        'admin',
        'manager',
        'operator',
        'viewer'
      )
    ),

  constraint tournament_members_status_check
    check (
      status in (
        'active',
        'inactive'
      )
    ),

  constraint tournament_members_unique
    unique (
      tournament_id,
      user_id,
      role
    )
);


create index tournament_members_tournament_idx
on public.tournament_members(tournament_id);


create index tournament_members_user_idx
on public.tournament_members(user_id);


create index tournament_members_user_status_idx
on public.tournament_members(
  user_id,
  status
);


-- ============================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================

create trigger sports_set_updated_at
before update on public.sports
for each row
execute function public.set_updated_at();


create trigger tournaments_set_updated_at
before update on public.tournaments
for each row
execute function public.set_updated_at();


create trigger tournament_settings_set_updated_at
before update on public.tournament_settings
for each row
execute function public.set_updated_at();


create trigger tournament_members_set_updated_at
before update on public.tournament_members
for each row
execute function public.set_updated_at();


-- ============================================================
-- 6. TOURNAMENT AUTHORIZATION HELPERS
-- ============================================================

create or replace function public.is_tournament_member(
  target_tournament_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tournament_members tm
    where tm.tournament_id = target_tournament_id
      and tm.user_id = (select auth.uid())
      and tm.status = 'active'
  );
$$;


create or replace function public.has_tournament_role(
  target_tournament_id uuid,
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
    from public.tournament_members tm
    where tm.tournament_id = target_tournament_id
      and tm.user_id = (select auth.uid())
      and tm.status = 'active'
      and tm.role = any(allowed_roles)
  );
$$;


create or replace function public.can_view_tournament(
  target_tournament_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tournaments t
    where t.id = target_tournament_id
      and (
        public.is_organization_member(t.organization_id)
        or public.is_tournament_member(t.id)
      )
  );
$$;


create or replace function public.can_manage_tournament(
  target_tournament_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tournaments t
    where t.id = target_tournament_id
      and (
        public.has_organization_role(
          t.organization_id,
          array['owner', 'admin', 'manager']::text[]
        )
        or public.has_tournament_role(
          t.id,
          array['admin', 'manager']::text[]
        )
      )
  );
$$;


-- ============================================================
-- 7. LOCK DOWN AUTHORIZATION HELPERS
-- ============================================================

revoke all
on function public.is_tournament_member(uuid)
from public;

revoke all
on function public.has_tournament_role(uuid, text[])
from public;

revoke all
on function public.can_view_tournament(uuid)
from public;

revoke all
on function public.can_manage_tournament(uuid)
from public;


grant execute
on function public.is_tournament_member(uuid)
to authenticated;

grant execute
on function public.has_tournament_role(uuid, text[])
to authenticated;

grant execute
on function public.can_view_tournament(uuid)
to authenticated;

grant execute
on function public.can_manage_tournament(uuid)
to authenticated;


-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

alter table public.sports
enable row level security;

alter table public.tournaments
enable row level security;

alter table public.tournament_settings
enable row level security;

alter table public.tournament_members
enable row level security;


-- ============================================================
-- 9. SPORTS POLICIES
-- ============================================================
--
-- Authenticated application users may read enabled sports.
-- Sports are platform-level reference data.
-- ============================================================

create policy "sports_select_authenticated"
on public.sports
for select
to authenticated
using (
  status = 'active'
);


-- ============================================================
-- 10. TOURNAMENT POLICIES
-- ============================================================

create policy "tournaments_select_authorized"
on public.tournaments
for select
to authenticated
using (
  public.is_organization_member(organization_id)
  or public.is_tournament_member(id)
);


create policy "tournaments_insert_organization_manager"
on public.tournaments
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and public.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager']::text[]
  )
);


create policy "tournaments_update_authorized"
on public.tournaments
for update
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager']::text[]
  )
  or public.has_tournament_role(
    id,
    array['admin', 'manager']::text[]
  )
)
with check (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager']::text[]
  )
  or public.has_tournament_role(
    id,
    array['admin', 'manager']::text[]
  )
);


create policy "tournaments_delete_organization_admin"
on public.tournaments
for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::text[]
  )
);


-- ============================================================
-- 11. TOURNAMENT SETTINGS POLICIES
-- ============================================================

create policy "tournament_settings_select_authorized"
on public.tournament_settings
for select
to authenticated
using (
  public.can_view_tournament(tournament_id)
);


create policy "tournament_settings_insert_authorized"
on public.tournament_settings
for insert
to authenticated
with check (
  public.can_manage_tournament(tournament_id)
);


create policy "tournament_settings_update_authorized"
on public.tournament_settings
for update
to authenticated
using (
  public.can_manage_tournament(tournament_id)
)
with check (
  public.can_manage_tournament(tournament_id)
);


create policy "tournament_settings_delete_authorized"
on public.tournament_settings
for delete
to authenticated
using (
  public.can_manage_tournament(tournament_id)
);


-- ============================================================
-- 12. TOURNAMENT MEMBER POLICIES
-- ============================================================

create policy "tournament_members_select_authorized"
on public.tournament_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.can_view_tournament(tournament_id)
);


create policy "tournament_members_insert_authorized"
on public.tournament_members
for insert
to authenticated
with check (
  public.can_manage_tournament(tournament_id)
);


create policy "tournament_members_update_authorized"
on public.tournament_members
for update
to authenticated
using (
  public.can_manage_tournament(tournament_id)
)
with check (
  public.can_manage_tournament(tournament_id)
);


create policy "tournament_members_delete_authorized"
on public.tournament_members
for delete
to authenticated
using (
  public.can_manage_tournament(tournament_id)
);


-- ============================================================
-- 13. DATA API PRIVILEGES
-- ============================================================
--
-- RLS remains the final row-level authorization boundary.
-- ============================================================

grant select
on table public.sports
to authenticated;


grant select, insert, update, delete
on table public.tournaments
to authenticated;


grant select, insert, update, delete
on table public.tournament_settings
to authenticated;


grant select, insert, update, delete
on table public.tournament_members
to authenticated;


-- ============================================================
-- 14. INITIAL SPORTS
-- ============================================================
--
-- Initial sports required by the master specification.
-- Additional sports can be introduced without changing the
-- tournament schema.
-- ============================================================

insert into public.sports (
  name,
  slug,
  status
)
values
  (
    'Football',
    'football',
    'active'
  ),
  (
    'Futsal',
    'futsal',
    'active'
  );