create table if not exists public.tournament_registration_settings (
  tournament_id uuid primary key references public.tournaments(id) on delete cascade,
  status text not null default 'closed' check(status in ('closed','scheduled','open','paused','full','completed')),
  opens_at timestamptz, closes_at timestamptz, team_capacity integer check(team_capacity is null or team_capacity > 0),
  registration_fee numeric(12,2) not null default 0 check(registration_fee >= 0), currency text not null default 'MVR',
  require_payment boolean not null default false, require_documents boolean not null default true,
  public_instructions text, confirmation_message text, updated_at timestamptz not null default now()
);
create table if not exists public.tournament_registration_applications (
  id uuid primary key default gen_random_uuid(), tournament_id uuid not null references public.tournaments(id) on delete cascade,
  application_no bigint generated always as identity, team_name text not null, short_name text, manager_name text not null,
  manager_email text, manager_phone text, notes text, status text not null default 'draft' check(status in ('draft','submitted','under_review','changes_requested','approved','waitlisted','rejected','withdrawn')),
  payment_status text not null default 'unpaid' check(payment_status in ('unpaid','pending','paid','waived','refunded')),
  submitted_at timestamptz, reviewed_at timestamptz, reviewed_by uuid references auth.users(id) on delete set null,
  decision_notes text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.tournament_registration_invitations (
 id uuid primary key default gen_random_uuid(), tournament_id uuid not null references public.tournaments(id) on delete cascade,
 team_name text not null, contact_name text, email text, phone text, status text not null default 'pending' check(status in ('pending','accepted','expired','cancelled')),
 invited_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now()
);
create index if not exists registration_apps_tournament_status_idx on public.tournament_registration_applications(tournament_id,status,created_at desc);
create index if not exists registration_invites_tournament_idx on public.tournament_registration_invitations(tournament_id,status,created_at desc);
alter table public.tournament_registration_settings enable row level security;
alter table public.tournament_registration_applications enable row level security;
alter table public.tournament_registration_invitations enable row level security;
create policy registration_settings_member_select on public.tournament_registration_settings for select to authenticated using(public.is_tournament_member(tournament_id) or public.can_manage_tournament(tournament_id));
create policy registration_settings_manager_all on public.tournament_registration_settings for all to authenticated using(public.can_manage_tournament(tournament_id)) with check(public.can_manage_tournament(tournament_id));
create policy registration_apps_member_select on public.tournament_registration_applications for select to authenticated using(public.is_tournament_member(tournament_id) or public.can_manage_tournament(tournament_id));
create policy registration_apps_manager_all on public.tournament_registration_applications for all to authenticated using(public.can_manage_tournament(tournament_id)) with check(public.can_manage_tournament(tournament_id));
create policy registration_invites_member_select on public.tournament_registration_invitations for select to authenticated using(public.is_tournament_member(tournament_id) or public.can_manage_tournament(tournament_id));
create policy registration_invites_manager_all on public.tournament_registration_invitations for all to authenticated using(public.can_manage_tournament(tournament_id)) with check(public.can_manage_tournament(tournament_id));
grant select,insert,update,delete on public.tournament_registration_settings, public.tournament_registration_applications, public.tournament_registration_invitations to authenticated;
