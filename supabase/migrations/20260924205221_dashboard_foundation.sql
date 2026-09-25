-- ============================================================
-- KULHIVARU+
-- DASHBOARD DOMAIN FOUNDATION
-- ============================================================
--
-- Shared authenticated dashboard services:
--   1. organization_invitations
--   2. tasks
--   3. notifications
--   4. audit_logs
--
-- Existing foundation used:
--   public.profiles
--   public.organizations
--   public.organization_members
--   public.is_organization_member(uuid)
--   public.has_organization_role(uuid, text[])
--
-- Security model:
--   - RLS enabled on every table
--   - users see only authorized organization data
--   - personal notifications are visible only to recipient
--   - privileged organization operations are role-scoped
-- ============================================================


-- ============================================================
-- 1. ORGANIZATION INVITATIONS
-- ============================================================

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  email text not null,

  role text not null default 'manager',

  status text not null default 'pending',

  invited_by uuid not null
    references auth.users(id)
    on delete restrict,

  accepted_by uuid
    references auth.users(id)
    on delete set null,

  expires_at timestamptz,

  responded_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organization_invitations_email_not_blank
    check (length(trim(email)) > 0),

  constraint organization_invitations_role_check
    check (
      role in (
        'admin',
        'manager'
      )
    ),

  constraint organization_invitations_status_check
    check (
      status in (
        'pending',
        'accepted',
        'declined',
        'cancelled',
        'expired'
      )
    )
);


-- Only one pending invitation for the same email in an organization.

create unique index organization_invitations_pending_unique
on public.organization_invitations (
  organization_id,
  lower(email)
)
where status = 'pending';


create index organization_invitations_organization_idx
on public.organization_invitations (organization_id);


create index organization_invitations_email_idx
on public.organization_invitations (lower(email));


create index organization_invitations_status_idx
on public.organization_invitations (status);


create index organization_invitations_created_at_idx
on public.organization_invitations (created_at desc);


-- ============================================================
-- 2. TASKS
-- ============================================================

create table public.tasks (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  title text not null,

  description text,

  status text not null default 'open',

  priority text not null default 'normal',

  assigned_to uuid
    references auth.users(id)
    on delete set null,

  created_by uuid not null
    references auth.users(id)
    on delete restrict,

  due_at timestamptz,

  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tasks_title_not_blank
    check (length(trim(title)) > 0),

  constraint tasks_title_length
    check (char_length(title) <= 200),

  constraint tasks_status_check
    check (
      status in (
        'open',
        'in_progress',
        'completed',
        'cancelled'
      )
    ),

  constraint tasks_priority_check
    check (
      priority in (
        'low',
        'normal',
        'high',
        'urgent'
      )
    )
);


create index tasks_organization_idx
on public.tasks (organization_id);


create index tasks_assigned_to_idx
on public.tasks (assigned_to);


create index tasks_status_idx
on public.tasks (status);


create index tasks_due_at_idx
on public.tasks (due_at)
where due_at is not null;


create index tasks_dashboard_idx
on public.tasks (
  organization_id,
  status,
  priority,
  due_at
);


-- ============================================================
-- 3. NOTIFICATIONS
-- ============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  organization_id uuid
    references public.organizations(id)
    on delete cascade,

  type text not null,

  title text not null,

  message text,

  action_url text,

  read_at timestamptz,

  created_at timestamptz not null default now(),

  constraint notifications_type_not_blank
    check (length(trim(type)) > 0),

  constraint notifications_title_not_blank
    check (length(trim(title)) > 0),

  constraint notifications_title_length
    check (char_length(title) <= 200),

  constraint notifications_action_url_check
    check (
      action_url is null
      or action_url like '/%'
    )
);


create index notifications_user_idx
on public.notifications (user_id);


create index notifications_user_created_idx
on public.notifications (
  user_id,
  created_at desc
);


create index notifications_unread_idx
on public.notifications (
  user_id,
  created_at desc
)
where read_at is null;


create index notifications_organization_idx
on public.notifications (organization_id)
where organization_id is not null;


-- ============================================================
-- 4. AUDIT LOGS
-- ============================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid
    references public.organizations(id)
    on delete set null,

  actor_user_id uuid
    references auth.users(id)
    on delete set null,

  action text not null,

  entity_type text not null,

  entity_id uuid,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  constraint audit_logs_action_not_blank
    check (length(trim(action)) > 0),

  constraint audit_logs_entity_type_not_blank
    check (length(trim(entity_type)) > 0),

  constraint audit_logs_metadata_object
    check (jsonb_typeof(metadata) = 'object')
);


create index audit_logs_organization_idx
on public.audit_logs (
  organization_id,
  created_at desc
);


create index audit_logs_actor_idx
on public.audit_logs (
  actor_user_id,
  created_at desc
);


create index audit_logs_entity_idx
on public.audit_logs (
  entity_type,
  entity_id,
  created_at desc
);


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
--
-- public.set_updated_at() already exists from the core schema.
-- Reuse it rather than creating another implementation.
-- ============================================================

create trigger organization_invitations_set_updated_at
before update on public.organization_invitations
for each row
execute function public.set_updated_at();


create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.organization_invitations
enable row level security;

alter table public.tasks
enable row level security;

alter table public.notifications
enable row level security;

alter table public.audit_logs
enable row level security;


-- ============================================================
-- ORGANIZATION INVITATIONS — SELECT
--
-- Visible to:
--   1. active members of the organization
--   2. the authenticated user whose email matches invitation
-- ============================================================

create policy "organization_invitations_select_authorized"
on public.organization_invitations
for select
to authenticated
using (
  public.is_organization_member(organization_id)
  or lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);


-- ============================================================
-- ORGANIZATION INVITATIONS — INSERT
--
-- Owners/admins may invite organization members.
-- ============================================================

create policy "organization_invitations_insert_manager"
on public.organization_invitations
for insert
to authenticated
with check (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']
  )
  and invited_by = (select auth.uid())
);


-- ============================================================
-- ORGANIZATION INVITATIONS — UPDATE
--
-- Organization owners/admins may manage invitations.
--
-- Recipient acceptance/decline will later use a controlled
-- server/RPC workflow instead of unrestricted client updates.
-- ============================================================

create policy "organization_invitations_update_manager"
on public.organization_invitations
for update
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']
  )
)
with check (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']
  )
);


-- ============================================================
-- ORGANIZATION INVITATIONS — DELETE
--
-- Owner/admin only.
-- ============================================================

create policy "organization_invitations_delete_manager"
on public.organization_invitations
for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']
  )
);


-- ============================================================
-- TASKS — SELECT
--
-- Any active member of the organization may read tasks.
-- ============================================================

create policy "tasks_select_member"
on public.tasks
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);


-- ============================================================
-- TASKS — INSERT
--
-- Owner/admin/manager may create organization tasks.
-- ============================================================

create policy "tasks_insert_manager"
on public.tasks
for insert
to authenticated
with check (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager']
  )
  and created_by = (select auth.uid())
);


-- ============================================================
-- TASKS — UPDATE
--
-- Owner/admin/manager may update organization tasks.
-- ============================================================

create policy "tasks_update_manager"
on public.tasks
for update
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager']
  )
)
with check (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin', 'manager']
  )
);


-- ============================================================
-- TASKS — DELETE
--
-- Only owner/admin may delete tasks.
-- ============================================================

create policy "tasks_delete_admin"
on public.tasks
for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']
  )
);


-- ============================================================
-- NOTIFICATIONS — SELECT
--
-- Users may only read their own notifications.
-- ============================================================

create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (
  user_id = (select auth.uid())
);


-- ============================================================
-- NOTIFICATIONS — UPDATE
--
-- Allows recipient to mark their own notification read/unread.
--
-- The WITH CHECK prevents changing ownership to another user.
-- ============================================================

create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (
  user_id = (select auth.uid())
)
with check (
  user_id = (select auth.uid())
);


-- ============================================================
-- AUDIT LOGS — SELECT
--
-- Organization members may read organization audit activity.
--
-- Personal/non-organization audit entries are visible only
-- to the actor.
-- ============================================================

create policy "audit_logs_select_authorized"
on public.audit_logs
for select
to authenticated
using (
  (
    organization_id is not null
    and public.is_organization_member(organization_id)
  )
  or
  (
    organization_id is null
    and actor_user_id = (select auth.uid())
  )
);


-- ============================================================
-- AUDIT LOGS
--
-- No INSERT/UPDATE/DELETE policy is intentionally provided.
--
-- Audit records should not be directly created or changed
-- through the normal authenticated Data API.
--
-- Trusted SECURITY DEFINER functions/server-controlled
-- operations can create audit records.
-- ============================================================


-- ============================================================
-- DATA API PRIVILEGES
-- ============================================================

grant select, insert, update, delete
on table public.organization_invitations
to authenticated;


grant select, insert, update, delete
on table public.tasks
to authenticated;


grant select, update
on table public.notifications
to authenticated;


grant select
on table public.audit_logs
to authenticated;


-- ============================================================
-- INVITATION RESPONSE RPC
--
-- Atomically:
--   - validates authentication
--   - locks invitation
--   - verifies recipient email
--   - verifies invitation lifecycle
--   - creates/updates membership when accepted
--   - updates invitation state
--   - writes notification
--   - writes audit record
--
-- This prevents the client from directly declaring an
-- invitation accepted.
-- ============================================================

create or replace function public.respond_to_organization_invitation(
  invitation_id uuid,
  response text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  current_user_email text;

  invitation_record public.organization_invitations%rowtype;

  normalized_response text;

  membership_id uuid;
begin

  -- ----------------------------------------------------------
  -- AUTHENTICATION
  -- ----------------------------------------------------------

  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;


  current_user_email :=
    lower(
      coalesce(
        auth.jwt() ->> 'email',
        ''
      )
    );

  if current_user_email = '' then
    raise exception 'Authenticated user email is required';
  end if;


  -- ----------------------------------------------------------
  -- INPUT VALIDATION
  -- ----------------------------------------------------------

  normalized_response := lower(trim(response));

  if normalized_response not in ('accepted', 'declined') then
    raise exception 'Response must be accepted or declined';
  end if;


  -- ----------------------------------------------------------
  -- LOCK INVITATION
  -- ----------------------------------------------------------

  select *
  into invitation_record
  from public.organization_invitations
  where id = invitation_id
  for update;


  if not found then
    raise exception 'Invitation not found';
  end if;


  -- ----------------------------------------------------------
  -- RECIPIENT AUTHORIZATION
  -- ----------------------------------------------------------

  if lower(invitation_record.email) <> current_user_email then
    raise exception 'You are not authorized to respond to this invitation';
  end if;


  -- ----------------------------------------------------------
  -- LIFECYCLE VALIDATION
  -- ----------------------------------------------------------

  if invitation_record.status <> 'pending' then
    raise exception 'Invitation is no longer pending';
  end if;


  if invitation_record.expires_at is not null
     and invitation_record.expires_at <= now() then

    update public.organization_invitations
    set
      status = 'expired',
      responded_at = now()
    where id = invitation_record.id;

    raise exception 'Invitation has expired';
  end if;


  -- ----------------------------------------------------------
  -- ACCEPT
  -- ----------------------------------------------------------

  if normalized_response = 'accepted' then

    insert into public.organization_members (
      organization_id,
      user_id,
      role,
      status
    )
    values (
      invitation_record.organization_id,
      current_user_id,
      invitation_record.role,
      'active'
    )
    on conflict (organization_id, user_id)
    do update
    set
      role = excluded.role,
      status = 'active',
      updated_at = now()
    returning id into membership_id;


    update public.organization_invitations
    set
      status = 'accepted',
      accepted_by = current_user_id,
      responded_at = now()
    where id = invitation_record.id;


    insert into public.notifications (
      user_id,
      organization_id,
      type,
      title,
      message,
      action_url
    )
    values (
      current_user_id,
      invitation_record.organization_id,
      'organization_invitation_accepted',
      'Organization invitation accepted',
      'You now have access to the organization.',
      '/dashboard'
    );


    insert into public.audit_logs (
      organization_id,
      actor_user_id,
      action,
      entity_type,
      entity_id,
      metadata
    )
    values (
      invitation_record.organization_id,
      current_user_id,
      'organization.invitation.accepted',
      'organization_invitation',
      invitation_record.id,
      jsonb_build_object(
        'role',
        invitation_record.role
      )
    );


    return membership_id;

  end if;


  -- ----------------------------------------------------------
  -- DECLINE
  -- ----------------------------------------------------------

  update public.organization_invitations
  set
    status = 'declined',
    responded_at = now()
  where id = invitation_record.id;


  insert into public.audit_logs (
    organization_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    invitation_record.organization_id,
    current_user_id,
    'organization.invitation.declined',
    'organization_invitation',
    invitation_record.id,
    '{}'::jsonb
  );


  return null;

end;
$$;


-- ============================================================
-- RPC SECURITY
-- ============================================================

revoke all
on function public.respond_to_organization_invitation(uuid, text)
from public;


grant execute
on function public.respond_to_organization_invitation(uuid, text)
to authenticated;