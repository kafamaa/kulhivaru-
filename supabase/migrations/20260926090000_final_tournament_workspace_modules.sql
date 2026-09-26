-- Final KULHIVARU+ tournament workspace architecture.
-- Keep legacy module values valid so existing records remain readable while
-- enabling the final 24-module workspace and settings/administration pages.

alter table public.tournament_module_records
  drop constraint if exists tournament_module_records_module_check;

alter table public.tournament_module_records
  add constraint tournament_module_records_module_check
  check (
    module in (
      'registration','teams','players','groups-stages','fixtures','matches',
      'live-control','standings','statistics','discipline','transfers',
      'protests-appeals','awards','officials','venues','communications','news',
      'media','sponsors','finance','documents','reports','staff-permissions',
      'notifications','integrations','activity-audit','archive-delete',
      -- legacy/internal workflow values retained for backwards compatibility
      'draw','qualification','tasks-readiness','completion-archive'
    )
  );

create index if not exists tournament_module_records_tournament_module_status_idx
  on public.tournament_module_records (tournament_id, module, status);
