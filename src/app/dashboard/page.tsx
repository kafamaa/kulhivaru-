import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// TYPES
// ============================================================

type Organization = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  status: string
}

type Membership = {
  id: string
  organization_id: string
  role: string
  status: string
  joined_at: string | null
  organizations: Organization | Organization[] | null
}

type Task = {
  id: string
  organization_id: string
  title: string
  description: string | null
  status: string
  priority: string
  assigned_to: string | null
  created_by: string
  due_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

type Invitation = {
  id: string
  organization_id: string
  email: string
  role: string
  status: string
  invited_by: string
  accepted_by: string | null
  expires_at: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
}

type Notification = {
  id: string
  user_id: string
  organization_id: string | null
  type: string
  title: string
  message: string | null
  action_url: string | null
  read_at: string | null
  created_at: string
}

type AuditLog = {
  id: string
  organization_id: string | null
  actor_user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ============================================================
// HELPERS
// ============================================================

function getOrganization(membership: Membership) {
  if (Array.isArray(membership.organizations)) {
    return membership.organizations[0] ?? null
  }

  return membership.organizations
}

function formatRole(role: string) {
  if (!role) return 'Member'

  return role
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatLabel(value: string) {
  if (!value) return ''

  return value
    .replaceAll('.', ' ')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string | null) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function isOverdue(value: string | null) {
  if (!value) return false

  const due = new Date(value)

  if (Number.isNaN(due.getTime())) {
    return false
  }

  return due.getTime() < Date.now()
}

function priorityWeight(priority: string) {
  switch (priority) {
    case 'urgent':
      return 4
    case 'high':
      return 3
    case 'normal':
      return 2
    case 'low':
      return 1
    default:
      return 0
  }
}

function priorityClasses(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-50 text-red-600'
    case 'high':
      return 'bg-orange-50 text-orange-600'
    case 'normal':
      return 'bg-blue-50 text-blue-600'
    default:
      return 'bg-slate-100 text-slate-500'
  }
}

// ============================================================
// PAGE
// ============================================================

export default async function DashboardPage() {
  const supabase = await createClient()

  // ==========================================================
  // AUTH
  // ==========================================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // ==========================================================
  // PROFILE
  // ==========================================================

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      `
        id,
        full_name,
        display_name,
        avatar_url
      `
    )
    .eq('id', user.id)
    .maybeSingle()

  // ==========================================================
  // AUTHORIZED ORGANIZATIONS
  // ==========================================================

  const { data: membershipData, error: membershipError } = await supabase
    .from('organization_members')
    .select(
      `
        id,
        organization_id,
        role,
        status,
        joined_at,
        organizations (
          id,
          name,
          slug,
          description,
          logo_url,
          status
        )
      `
    )
    .eq('status', 'active')
    .order('joined_at', { ascending: false })

  const memberships = (membershipData ?? []) as Membership[]

  const organizations = memberships
    .map((membership) => ({
      membership,
      organization: getOrganization(membership),
    }))
    .filter(
      (
        item
      ): item is {
        membership: Membership
        organization: Organization
      } => item.organization !== null
    )

  const organizationIds = organizations.map(
    ({ organization }) => organization.id
  )

  // ==========================================================
  // DASHBOARD DATA
  // ==========================================================

  const [
    tasksResult,
    invitationsResult,
    notificationsResult,
    activityResult,
  ] = await Promise.all([
    organizationIds.length > 0
      ? supabase
          .from('tasks')
          .select(
            `
              id,
              organization_id,
              title,
              description,
              status,
              priority,
              assigned_to,
              created_by,
              due_at,
              completed_at,
              created_at,
              updated_at
            `
          )
          .in('organization_id', organizationIds)
          .in('status', ['open', 'in_progress'])
          .order('due_at', {
            ascending: true,
            nullsFirst: false,
          })
          .limit(20)
      : Promise.resolve({
          data: [] as Task[],
          error: null,
        }),

    supabase
      .from('organization_invitations')
      .select(
        `
          id,
          organization_id,
          email,
          role,
          status,
          invited_by,
          accepted_by,
          expires_at,
          responded_at,
          created_at,
          updated_at
        `
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('notifications')
      .select(
        `
          id,
          user_id,
          organization_id,
          type,
          title,
          message,
          action_url,
          read_at,
          created_at
        `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),

    organizationIds.length > 0
      ? supabase
          .from('audit_logs')
          .select(
            `
              id,
              organization_id,
              actor_user_id,
              action,
              entity_type,
              entity_id,
              metadata,
              created_at
            `
          )
          .in('organization_id', organizationIds)
          .order('created_at', { ascending: false })
          .limit(8)
      : Promise.resolve({
          data: [] as AuditLog[],
          error: null,
        }),
  ])

  const tasks = (tasksResult.data ?? []) as Task[]
  const invitations = (invitationsResult.data ?? []) as Invitation[]
  const notifications = (notificationsResult.data ?? []) as Notification[]
  const activities = (activityResult.data ?? []) as AuditLog[]

  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const displayName =
    profile?.display_name?.trim() ||
    profile?.full_name?.trim() ||
    user.email?.split('@')[0] ||
    'User'

  const firstName = displayName.split(/\s+/)[0] || 'User'
  const initial = displayName.charAt(0).toUpperCase() || 'U'

  const organizationCount = organizations.length

  const ownedOrganizations = organizations.filter(
    ({ membership }) => membership.role === 'owner'
  ).length

  const managedOrganizations = organizations.filter(
    ({ membership }) =>
      membership.role === 'admin' || membership.role === 'manager'
  ).length

  const primaryWorkspace = organizations[0] ?? null

  const organizationMap = new Map(
    organizations.map(({ organization }) => [
      organization.id,
      organization,
    ])
  )

  const unreadNotifications = notifications.filter(
    (notification) => !notification.read_at
  )

  const myTasks = tasks.filter(
    (task) => task.assigned_to === user.id || task.assigned_to === null
  )

  const overdueTasks = myTasks.filter((task) => isOverdue(task.due_at))

  const sortedTasks = [...myTasks].sort((a, b) => {
    const overdueDifference =
      Number(isOverdue(b.due_at)) - Number(isOverdue(a.due_at))

    if (overdueDifference !== 0) {
      return overdueDifference
    }

    const priorityDifference =
      priorityWeight(b.priority) - priorityWeight(a.priority)

    if (priorityDifference !== 0) {
      return priorityDifference
    }

    if (a.due_at && b.due_at) {
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    }

    if (a.due_at) return -1
    if (b.due_at) return 1

    return 0
  })

  const nextTask = sortedTasks[0] ?? null

  const hasLoadError = Boolean(
    profileError ||
      membershipError ||
      tasksResult.error ||
      invitationsResult.error ||
      notificationsResult.error ||
      activityResult.error
  )

  const attentionCount =
    overdueTasks.length +
    invitations.length +
    unreadNotifications.length +
    myTasks.filter((task) => task.priority === 'urgent').length

  // ==========================================================
  // NEXT ACTION
  // ==========================================================

  let nextActionTitle = 'Create your first organization'
  let nextActionDescription =
    'Set up your first sports organization to begin managing your work.'
  let nextActionHref = '/organizations/new'
  let nextActionButton = 'Create Organization'

  if (organizationCount > 0 && primaryWorkspace) {
    nextActionTitle = 'Continue your workspace'
    nextActionDescription =
      'Open your organization and continue managing your sports operations.'
    nextActionHref = `/organizations/${primaryWorkspace.organization.id}`
    nextActionButton = `Open ${primaryWorkspace.organization.name}`
  }

  if (nextTask) {
    nextActionTitle = nextTask.title

    if (isOverdue(nextTask.due_at)) {
      nextActionDescription =
        'This task is overdue and should be reviewed as soon as possible.'
    } else if (nextTask.due_at) {
      nextActionDescription = `Priority task due ${formatDate(
        nextTask.due_at
      )}.`
    } else {
      nextActionDescription =
        'This is the highest-priority actionable task currently assigned to you.'
    }

    nextActionHref = `/organizations/${nextTask.organization_id}`
    nextActionButton = 'Open Workspace'
  }

  if (invitations.length > 0) {
    nextActionTitle = 'Review organization invitation'
    nextActionDescription =
      'You have a pending invitation waiting for your response.'
    nextActionHref = '/requests'
    nextActionButton = 'Review Invitation'
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-[#081f49]">
      {/* ======================================================
          DESKTOP SIDEBAR
          ====================================================== */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-[78px] items-center border-b border-slate-100 px-6">
          <Link href="/dashboard">
            <Image
              src="/branding/kulhivaru-full-logo.png"
              alt="Kulhivaru+"
              width={170}
              height={60}
              priority
              className="h-auto max-h-[52px] w-auto"
            />
          </Link>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex-1 overflow-y-auto px-3 py-5"
        >
          <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            My Kulhivaru
          </p>

          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="flex min-h-[44px] items-center gap-3 rounded-xl bg-gradient-to-r from-[#0057ff]/10 to-[#00ceef]/[0.08] px-3 text-sm font-bold text-[#0057ff]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[19px] w-[19px] fill-none stroke-current"
                strokeWidth="1.9"
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>

              Dashboard
            </Link>

            <Link
              href="/organizations"
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[#0057ff]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[19px] w-[19px] fill-none stroke-current"
                strokeWidth="1.9"
              >
                <path d="M3 21h18" />
                <path d="M6 21V7l6-4 6 4v14" />
                <path d="M9 10h2M13 10h2M9 14h2M13 14h2" />
              </svg>

              Organizations
            </Link>

            <Link
              href="/requests"
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[#0057ff]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[19px] w-[19px] fill-none stroke-current"
                strokeWidth="1.9"
              >
                <path d="M4 5h16v12H8l-4 4V5Z" />
                <path d="M8 9h8M8 13h5" />
              </svg>

              <span className="flex-1">Requests</span>

              {invitations.length > 0 && (
                <span className="flex min-w-5 items-center justify-center rounded-full bg-[#0057ff] px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                  {invitations.length}
                </span>
              )}
            </Link>

            <Link
              href="/notifications"
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[#0057ff]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[19px] w-[19px] fill-none stroke-current"
                strokeWidth="1.9"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>

              <span className="flex-1">Notifications</span>

              {unreadNotifications.length > 0 && (
                <span className="flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                  {unreadNotifications.length}
                </span>
              )}
            </Link>
          </div>

          <p className="mb-2 mt-8 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            Account
          </p>

          <div className="space-y-1">
            <Link
              href="/settings/profile"
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[#0057ff]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[19px] w-[19px] fill-none stroke-current"
                strokeWidth="1.9"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
              </svg>

              Profile
            </Link>

            <Link
              href="/settings/security"
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[#0057ff]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[19px] w-[19px] fill-none stroke-current"
                strokeWidth="1.9"
              >
                <path d="M12 3 4 7v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V7l-8-4Z" />
                <path d="M9 12h6" />
              </svg>

              Security
            </Link>
          </div>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <Link
            href="/settings/profile"
            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
          >
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={displayName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0057ff] to-[#00ceef] text-sm font-extrabold text-white">
                {initial}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#081f49]">
                {displayName}
              </p>

              <p className="truncate text-[11px] text-slate-400">
                {user.email}
              </p>
            </div>
          </Link>

          <form action="/auth/logout" method="post" className="mt-2">
            <button
              type="submit"
              className="flex min-h-[40px] w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-bold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[17px] w-[17px] fill-none stroke-current"
                strokeWidth="1.9"
              >
                <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
                <path d="M14 8l4 4-4 4" />
                <path d="M8 12h10" />
              </svg>

              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* ======================================================
          APP
          ====================================================== */}

      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
          <div className="flex h-[72px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="lg:hidden">
              <Image
                src="/branding/kulhivaru-full-logo.png"
                alt="Kulhivaru+"
                width={145}
                height={50}
                priority
                className="h-auto max-h-[44px] w-auto"
              />
            </Link>

            <div className="hidden min-w-0 lg:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Workspace
              </p>

              {primaryWorkspace ? (
                <Link
                  href={`/organizations/${primaryWorkspace.organization.id}`}
                  className="mt-1 flex items-center gap-2 text-sm font-bold text-[#081f49] transition hover:text-[#0057ff]"
                >
                  <span className="max-w-[260px] truncate">
                    {primaryWorkspace.organization.name}
                  </span>

                  <span>→</span>
                </Link>
              ) : (
                <p className="mt-1 text-sm font-bold text-[#081f49]">
                  Personal
                </p>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-[#0057ff]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-[18px] w-[18px] fill-none stroke-current"
                  strokeWidth="1.9"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>

                {unreadNotifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white">
                    {unreadNotifications.length > 99
                      ? '99+'
                      : unreadNotifications.length}
                  </span>
                )}
              </Link>

              <Link
                href="/settings/profile"
                className="ml-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl"
              >
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={displayName}
                    width={40}
                    height={40}
                    className="h-10 w-10 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-[#0057ff] to-[#00ceef] text-sm font-extrabold text-white">
                    {initial}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* ====================================================
            MAIN
            ==================================================== */}

        <main className="mx-auto max-w-[1450px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {hasLoadError && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4"
            >
              <p className="text-sm font-bold text-red-700">
                Some dashboard information could not be loaded.
              </p>

              <p className="mt-1 text-xs text-red-500">
                Refresh the page to try again.
              </p>
            </div>
          )}

          {/* WELCOME */}

          <section className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0057ff]">
                  My Kulhivaru
                </p>
              </div>

              <h1 className="text-[30px] font-extrabold tracking-tight text-[#081f49] sm:text-[36px]">
                Welcome back, {firstName}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Your command center for organizations, tasks, invitations,
                notifications and workspace activity.
              </p>
            </div>

            <Link
              href="/organizations/new"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-[#0057ff] to-[#00bce9] px-5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(0,87,255,0.20)]"
            >
              <span className="text-lg leading-none">+</span>
              Create Organization
            </Link>
          </section>

          {/* KPI */}

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Organizations
              </p>

              <p className="mt-3 text-[30px] font-extrabold text-[#081f49]">
                {organizationCount}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Authorized workspaces
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Open Tasks
              </p>

              <p className="mt-3 text-[30px] font-extrabold text-[#081f49]">
                {myTasks.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {overdueTasks.length > 0
                  ? `${overdueTasks.length} overdue`
                  : 'Nothing overdue'}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Invitations
              </p>

              <p className="mt-3 text-[30px] font-extrabold text-[#081f49]">
                {invitations.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Pending requests
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Notifications
              </p>

              <p className="mt-3 text-[30px] font-extrabold text-[#081f49]">
                {unreadNotifications.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Unread notifications
              </p>
            </article>
          </section>

          {/* ==================================================
              MAIN GRID
              ================================================== */}

          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
            <div className="space-y-6">
              {/* WORKSPACES */}

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#081f49]">
                      Your Workspaces
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Organizations you&apos;re authorized to access
                    </p>
                  </div>

                  <Link
                    href="/organizations"
                    className="text-xs font-bold text-[#0057ff]"
                  >
                    View all
                  </Link>
                </div>

                {organizations.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Image
                      src="/branding/kulhivaru-icon-mark.png"
                      alt=""
                      width={52}
                      height={52}
                      className="mx-auto h-12 w-12 object-contain opacity-70"
                    />

                    <h3 className="mt-4 text-lg font-extrabold">
                      No organization yet
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Create your first organization to start managing sports
                      operations.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {organizations.map(({ membership, organization }) => (
                      <Link
                        key={membership.id}
                        href={`/organizations/${organization.id}`}
                        className="group flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                      >
                        {organization.logo_url ? (
                          <Image
                            src={organization.logo_url}
                            alt={organization.name}
                            width={50}
                            height={50}
                            className="h-[50px] w-[50px] rounded-xl border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0057ff]/10 to-[#00ceef]/15 text-lg font-extrabold text-[#0057ff]">
                            {organization.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-extrabold">
                            {organization.name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatRole(membership.role)}
                          </p>
                        </div>

                        <span className="text-sm font-bold text-[#0057ff]">
                          Open →
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* TASKS */}

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <h2 className="text-lg font-extrabold">Tasks</h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Open work requiring action
                  </p>
                </div>

                {sortedTasks.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm font-bold">No open tasks</p>

                    <p className="mt-1 text-xs text-slate-400">
                      Your actionable tasks will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {sortedTasks.slice(0, 6).map((task) => {
                      const organization = organizationMap.get(
                        task.organization_id
                      )

                      const overdue = isOverdue(task.due_at)

                      return (
                        <Link
                          key={task.id}
                          href={`/organizations/${task.organization_id}`}
                          className="block px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-[#081f49]">
                                  {task.title}
                                </p>

                                <span
                                  className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${priorityClasses(
                                    task.priority
                                  )}`}
                                >
                                  {task.priority}
                                </span>

                                {overdue && (
                                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-red-600">
                                    Overdue
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs text-slate-400">
                                {organization?.name ?? 'Organization'}
                                {task.due_at
                                  ? ` • Due ${formatDate(task.due_at)}`
                                  : ''}
                              </p>
                            </div>

                            <span className="text-[#0057ff]">→</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* RECENT ACTIVITY */}

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <h2 className="text-lg font-extrabold">Recent Activity</h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Latest authorized workspace activity
                  </p>
                </div>

                {activities.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm font-bold">
                      No activity to show yet
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Workspace activity will appear here as records are
                      created.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activities.map((activity) => {
                      const organization = activity.organization_id
                        ? organizationMap.get(activity.organization_id)
                        : null

                      return (
                        <div
                          key={activity.id}
                          className="flex gap-3 px-5 py-4 sm:px-6"
                        >
                          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00bce9]" />

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[#081f49]">
                              {formatLabel(activity.action)}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {organization?.name ?? 'Account'}
                              {' • '}
                              {formatDateTime(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* ==================================================
                RIGHT COLUMN
                ================================================== */}

            <div className="space-y-6">
              {/* NEEDS ATTENTION */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-500">
                      Needs Attention
                    </p>

                    <h2 className="mt-1 text-2xl font-extrabold">
                      {attentionCount}
                    </h2>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                    !
                  </div>
                </div>

                {attentionCount === 0 ? (
                  <div className="mt-4 rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm font-bold text-emerald-700">
                      You&apos;re all caught up
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-600">
                      No overdue tasks, pending invitations or unread
                      notifications need attention.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {overdueTasks.length > 0 && (
                      <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
                        <span className="text-xs font-bold text-red-600">
                          Overdue tasks
                        </span>

                        <span className="text-sm font-extrabold text-red-600">
                          {overdueTasks.length}
                        </span>
                      </div>
                    )}

                    {invitations.length > 0 && (
                      <Link
                        href="/requests"
                        className="flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3"
                      >
                        <span className="text-xs font-bold text-violet-600">
                          Pending invitations
                        </span>

                        <span className="text-sm font-extrabold text-violet-600">
                          {invitations.length}
                        </span>
                      </Link>
                    )}

                    {unreadNotifications.length > 0 && (
                      <Link
                        href="/notifications"
                        className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3"
                      >
                        <span className="text-xs font-bold text-blue-600">
                          Unread notifications
                        </span>

                        <span className="text-sm font-extrabold text-blue-600">
                          {unreadNotifications.length}
                        </span>
                      </Link>
                    )}
                  </div>
                )}
              </section>

              {/* NEXT ACTION */}

              <section className="relative overflow-hidden rounded-2xl bg-[#081f49] p-5 text-white shadow-[0_14px_35px_rgba(8,31,73,0.14)]">
                <Image
                  src="/branding/kulhivaru-icon-mark.png"
                  alt=""
                  width={160}
                  height={160}
                  className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rotate-[-15deg] object-contain opacity-[0.06]"
                />

                <div className="relative">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#00ceef]">
                    Next Action
                  </p>

                  <h2 className="mt-2 text-lg font-extrabold">
                    {nextActionTitle}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {nextActionDescription}
                  </p>

                  <Link
                    href={nextActionHref}
                    className="mt-5 inline-flex min-h-[42px] max-w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#081f49]"
                  >
                    <span className="truncate">{nextActionButton}</span>
                    <span>→</span>
                  </Link>
                </div>
              </section>

              {/* NOTIFICATIONS */}

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                  <h2 className="text-base font-extrabold">
                    Notifications
                  </h2>

                  <Link
                    href="/notifications"
                    className="text-xs font-bold text-[#0057ff]"
                  >
                    View all
                  </Link>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-xs text-slate-400">
                      No notifications yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.slice(0, 5).map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.action_url ?? '/notifications'}
                        className="block p-4 transition hover:bg-slate-50"
                      >
                        <div className="flex gap-3">
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              notification.read_at
                                ? 'bg-slate-200'
                                : 'bg-[#0057ff]'
                            }`}
                          />

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#081f49]">
                              {notification.title}
                            </p>

                            {notification.message && (
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                                {notification.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* QUICK ACCESS */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
                <h2 className="text-base font-extrabold">Quick Access</h2>

                <div className="mt-4 space-y-1">
                  {[
                    ['Organizations', '/organizations'],
                    ['Requests & Invitations', '/requests'],
                    ['Notifications', '/notifications'],
                    ['Account Profile', '/settings/profile'],
                  ].map(([label, href]) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex min-h-[44px] items-center justify-between rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[#0057ff]"
                    >
                      <span>{label}</span>
                      <span>→</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="h-20 lg:hidden" />
        </main>

        {/* MOBILE NAV */}

        <nav
          aria-label="Mobile navigation"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
        >
          <div className="mx-auto grid max-w-md grid-cols-4">
            {[
              ['Home', '/dashboard'],
              ['Workspaces', '/organizations'],
              ['Requests', '/requests'],
              ['Profile', '/settings/profile'],
            ].map(([label, href], index) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 ${
                  index === 0 ? 'text-[#0057ff]' : 'text-slate-400'
                }`}
              >
                <span className="text-lg leading-none">
                  {index === 0
                    ? '⌂'
                    : index === 1
                      ? '◇'
                      : index === 2
                        ? '▣'
                        : '○'}
                </span>

                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}