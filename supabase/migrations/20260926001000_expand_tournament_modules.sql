-- Expand tournament workspace modules to cover the remaining KULHIVARU+ tournament domains.

alter table public.tournament_module_records
  drop constraint if exists tournament_module_records_module_check;

alter table public.tournament_module_records
  add constraint tournament_module_records_module_check
  check (
    module in (
      'registration',
      'teams',
      'players',
      'groups-stages',
      'draw',
      'fixtures',
      'matches',
      'live-control',
      'standings',
      'statistics',
      'qualification',
      'discipline',
      'awards',
      'officials',
      'venues',
      'finance',
      'tasks-readiness',
      'documents',
      'news',
      'sponsors',
      'staff-permissions',
      'activity-audit',
      'reports',
      'completion-archive'
    )
  );
