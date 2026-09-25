create table if not exists public.tournament_module_records (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  module text not null,
  title text not null,
  subtitle text,
  status text not null default 'active',
  scheduled_at timestamptz,
  sort_order integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_module_records_module_check check (module in ('registration','teams','players','groups-stages','fixtures','matches','live-control','standings','statistics','awards','officials','venues','news','sponsors','reports')),
  constraint tournament_module_records_title_check check (length(trim(title)) > 0 and char_length(title) <= 180),
  constraint tournament_module_records_status_check check (status in ('draft','active','pending','approved','scheduled','live','completed','cancelled','archived')),
  constraint tournament_module_records_data_object check (jsonb_typeof(data) = 'object')
);
create index if not exists tournament_module_records_tournament_module_idx on public.tournament_module_records(tournament_id,module,sort_order,created_at desc);
create index if not exists tournament_module_records_status_idx on public.tournament_module_records(tournament_id,module,status);
alter table public.tournament_module_records enable row level security;
create policy "module records view" on public.tournament_module_records for select to authenticated using (public.can_view_tournament(tournament_id));
create policy "module records insert" on public.tournament_module_records for insert to authenticated with check (public.can_manage_tournament(tournament_id) and created_by = (select auth.uid()));
create policy "module records update" on public.tournament_module_records for update to authenticated using (public.can_manage_tournament(tournament_id)) with check (public.can_manage_tournament(tournament_id));
create policy "module records delete" on public.tournament_module_records for delete to authenticated using (public.can_manage_tournament(tournament_id));
grant select, insert, update, delete on public.tournament_module_records to authenticated;
revoke all on public.tournament_module_records from anon;
