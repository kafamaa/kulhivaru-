-- KULHIVARU+ real participant domain foundation.
-- Replaces generic module records as the source of truth for teams and players.

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  short_name text,
  slug text not null,
  logo_url text,
  primary_color text,
  secondary_color text,
  location text,
  manager_name text,
  manager_phone text,
  manager_email text,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_name_not_blank check (length(trim(name)) > 0),
  constraint teams_slug_not_blank check (length(trim(slug)) > 0),
  constraint teams_org_slug_unique unique (organization_id, slug)
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  display_name text,
  date_of_birth date,
  nationality text,
  profile_photo_url text,
  position text,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_name_not_blank check (length(trim(full_name)) > 0)
);

create table if not exists public.tournament_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete restrict,
  seed_number integer,
  registration_status text not null default 'approved' check (registration_status in ('draft','pending','approved','rejected','withdrawn')),
  eligibility_status text not null default 'eligible' check (eligibility_status in ('pending','eligible','ineligible')),
  status text not null default 'active' check (status in ('active','withdrawn','disqualified','archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_teams_unique unique (tournament_id, team_id)
);

create table if not exists public.tournament_players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  tournament_team_id uuid not null references public.tournament_teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  jersey_number integer,
  position text,
  is_captain boolean not null default false,
  registration_status text not null default 'approved' check (registration_status in ('draft','pending','approved','rejected','withdrawn')),
  eligibility_status text not null default 'eligible' check (eligibility_status in ('pending','eligible','ineligible','suspended')),
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_players_unique unique (tournament_id, player_id),
  constraint tournament_players_jersey_check check (jersey_number is null or jersey_number between 0 and 999)
);

create index if not exists teams_organization_idx on public.teams(organization_id, status);
create index if not exists players_organization_idx on public.players(organization_id, status);
create index if not exists tournament_teams_tournament_idx on public.tournament_teams(tournament_id, status);
create index if not exists tournament_players_tournament_team_idx on public.tournament_players(tournament_id, tournament_team_id);

alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.tournament_teams enable row level security;
alter table public.tournament_players enable row level security;

create policy "teams view organization" on public.teams for select to authenticated using (public.is_organization_member(organization_id));
create policy "teams manage organization" on public.teams for all to authenticated using (public.has_organization_role(organization_id, array['owner','admin','manager']::text[])) with check (public.has_organization_role(organization_id, array['owner','admin','manager']::text[]) and created_by = (select auth.uid()));
create policy "players view organization" on public.players for select to authenticated using (public.is_organization_member(organization_id));
create policy "players manage organization" on public.players for all to authenticated using (public.has_organization_role(organization_id, array['owner','admin','manager']::text[])) with check (public.has_organization_role(organization_id, array['owner','admin','manager']::text[]) and created_by = (select auth.uid()));
create policy "tournament teams view" on public.tournament_teams for select to authenticated using (public.can_view_tournament(tournament_id));
create policy "tournament teams manage" on public.tournament_teams for all to authenticated using (public.can_manage_tournament(tournament_id)) with check (public.can_manage_tournament(tournament_id) and created_by = (select auth.uid()));
create policy "tournament players view" on public.tournament_players for select to authenticated using (public.can_view_tournament(tournament_id));
create policy "tournament players manage" on public.tournament_players for all to authenticated using (public.can_manage_tournament(tournament_id)) with check (public.can_manage_tournament(tournament_id) and created_by = (select auth.uid()));

grant select, insert, update, delete on public.teams, public.players, public.tournament_teams, public.tournament_players to authenticated;
revoke all on public.teams, public.players, public.tournament_teams, public.tournament_players from anon;
