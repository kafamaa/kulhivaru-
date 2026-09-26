-- Kulhivaru+ professional competition engine core
-- Purpose-built relational data replacing generic module records for core competition workflows.

create table if not exists public.tournament_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  short_name text,
  slug text not null,
  logo_url text,
  manager_name text,
  manager_user_id uuid references auth.users(id) on delete set null,
  seed integer,
  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn','suspended','archived')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, slug),
  check (length(trim(name)) > 0)
);

create table if not exists public.tournament_players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid references public.tournament_teams(id) on delete set null,
  full_name text not null,
  display_name text,
  photo_url text,
  jersey_number integer check (jersey_number is null or jersey_number between 0 and 999),
  position text,
  date_of_birth date,
  nationality text,
  registration_number text,
  eligibility_status text not null default 'pending' check (eligibility_status in ('pending','eligible','ineligible','suspended','withdrawn')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(full_name)) > 0)
);

create table if not exists public.tournament_stages (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  stage_type text not null check (stage_type in ('league','group','knockout','round_robin','swiss','custom')),
  sequence integer not null default 1 check (sequence > 0),
  status text not null default 'draft' check (status in ('draft','configured','active','completed','archived')),
  qualification_rules jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, sequence)
);

create table if not exists public.tournament_groups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  stage_id uuid not null references public.tournament_stages(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(stage_id, name)
);

create table if not exists public.tournament_group_teams (
  group_id uuid not null references public.tournament_groups(id) on delete cascade,
  team_id uuid not null references public.tournament_teams(id) on delete cascade,
  seed integer,
  created_at timestamptz not null default now(),
  primary key (group_id, team_id)
);

create table if not exists public.tournament_venues (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  location text,
  capacity integer check (capacity is null or capacity >= 0),
  status text not null default 'active' check (status in ('active','inactive','unavailable','archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  stage_id uuid references public.tournament_stages(id) on delete set null,
  group_id uuid references public.tournament_groups(id) on delete set null,
  home_team_id uuid references public.tournament_teams(id) on delete restrict,
  away_team_id uuid references public.tournament_teams(id) on delete restrict,
  venue_id uuid references public.tournament_venues(id) on delete set null,
  round_label text,
  match_number integer,
  scheduled_at timestamptz,
  status text not null default 'scheduled' check (status in ('draft','scheduled','warmup','live','halftime','extra_time','penalties','completed','postponed','cancelled','abandoned')),
  home_score integer not null default 0 check (home_score >= 0),
  away_score integer not null default 0 check (away_score >= 0),
  home_penalties integer check (home_penalties is null or home_penalties >= 0),
  away_penalties integer check (away_penalties is null or away_penalties >= 0),
  result_confirmed_at timestamptz,
  result_confirmed_by uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_team_id is null or away_team_id is null or home_team_id <> away_team_id),
  unique(tournament_id, match_number)
);

create table if not exists public.tournament_match_events (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  match_id uuid not null references public.tournament_matches(id) on delete cascade,
  team_id uuid references public.tournament_teams(id) on delete set null,
  player_id uuid references public.tournament_players(id) on delete set null,
  secondary_player_id uuid references public.tournament_players(id) on delete set null,
  event_type text not null check (event_type in ('goal','own_goal','penalty_goal','penalty_miss','yellow_card','red_card','second_yellow','substitution','injury','var','note')),
  minute integer check (minute is null or minute >= 0),
  stoppage_minute integer check (stoppage_minute is null or stoppage_minute >= 0),
  details jsonb not null default '{}'::jsonb,
  voided_at timestamptz,
  voided_by uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.tournament_standings (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  stage_id uuid not null references public.tournament_stages(id) on delete cascade,
  group_id uuid references public.tournament_groups(id) on delete cascade,
  team_id uuid not null references public.tournament_teams(id) on delete cascade,
  played integer not null default 0,
  won integer not null default 0,
  drawn integer not null default 0,
  lost integer not null default 0,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  goal_difference integer generated always as (goals_for - goals_against) stored,
  points numeric(10,3) not null default 0,
  rank integer,
  updated_at timestamptz not null default now(),
  primary key(stage_id, team_id)
);

create index if not exists tournament_teams_tournament_idx on public.tournament_teams(tournament_id,status,name);
create index if not exists tournament_players_tournament_team_idx on public.tournament_players(tournament_id,team_id,eligibility_status);
create index if not exists tournament_stages_tournament_idx on public.tournament_stages(tournament_id,sequence);
create index if not exists tournament_groups_stage_idx on public.tournament_groups(stage_id,sort_order);
create index if not exists tournament_matches_tournament_time_idx on public.tournament_matches(tournament_id,scheduled_at,status);
create index if not exists tournament_matches_home_idx on public.tournament_matches(home_team_id);
create index if not exists tournament_matches_away_idx on public.tournament_matches(away_team_id);
create index if not exists tournament_match_events_match_idx on public.tournament_match_events(match_id,created_at);
create index if not exists tournament_standings_group_rank_idx on public.tournament_standings(stage_id,group_id,rank);

alter table public.tournament_teams enable row level security;
alter table public.tournament_players enable row level security;
alter table public.tournament_stages enable row level security;
alter table public.tournament_groups enable row level security;
alter table public.tournament_group_teams enable row level security;
alter table public.tournament_venues enable row level security;
alter table public.tournament_matches enable row level security;
alter table public.tournament_match_events enable row level security;
alter table public.tournament_standings enable row level security;

do $$
declare t text;
begin
  foreach t in array array['tournament_teams','tournament_players','tournament_stages','tournament_venues','tournament_matches','tournament_match_events'] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.can_view_tournament(tournament_id))', t || '_select_authorized', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.can_manage_tournament(tournament_id))', t || '_insert_authorized', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.can_manage_tournament(tournament_id)) with check (public.can_manage_tournament(tournament_id))', t || '_update_authorized', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.can_manage_tournament(tournament_id))', t || '_delete_authorized', t);
  end loop;
end $$;

create policy tournament_groups_select_authorized on public.tournament_groups for select to authenticated using (public.can_view_tournament(tournament_id));
create policy tournament_groups_write_authorized on public.tournament_groups for all to authenticated using (public.can_manage_tournament(tournament_id)) with check (public.can_manage_tournament(tournament_id));
create policy tournament_group_teams_select_authorized on public.tournament_group_teams for select to authenticated using (exists(select 1 from public.tournament_groups g where g.id=group_id and public.can_view_tournament(g.tournament_id)));
create policy tournament_group_teams_write_authorized on public.tournament_group_teams for all to authenticated using (exists(select 1 from public.tournament_groups g where g.id=group_id and public.can_manage_tournament(g.tournament_id))) with check (exists(select 1 from public.tournament_groups g where g.id=group_id and public.can_manage_tournament(g.tournament_id)));
create policy tournament_standings_select_authorized on public.tournament_standings for select to authenticated using (public.can_view_tournament(tournament_id));
create policy tournament_standings_write_authorized on public.tournament_standings for all to authenticated using (public.can_manage_tournament(tournament_id)) with check (public.can_manage_tournament(tournament_id));

grant select,insert,update,delete on public.tournament_teams,public.tournament_players,public.tournament_stages,public.tournament_groups,public.tournament_group_teams,public.tournament_venues,public.tournament_matches,public.tournament_match_events to authenticated;
grant select on public.tournament_standings to authenticated;
