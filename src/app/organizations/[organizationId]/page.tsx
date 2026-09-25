import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Organization = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  status: string
  created_by: string
  created_at: string
  updated_at: string
}

type Membership = {
  id: string
  organization_id: string
  user_id: string
  role: string
  status: string
  joined_at: string
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

type Tournament = {
  id: string
  status: string
}

// ============================================================
// HELPERS
// ============================================================

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

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date.getTime() < Date.now()
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

export default async function OrganizationWorkspacePage({
  params,
}: {
  params: Promise<{ organizationId: string }>
}) {
  const { organizationId } = await params

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

  const { data: profile } = await supabase
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
  // MEMBERSHIP
  // ==========================================================

  const { data: membershipData, error: membershipError } = await supabase
    .from('organization_members')
    .select(
      `
        id,
        organization_id,
        user_id,
        role,
        status,
        joined_at
      `
    )
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membershipData) {
    notFound()
  }

  const membership = membershipData as Membership

  // ==========================================================
  // ORGANIZATION
  // ==========================================================

  const { data: organizationData, error: organizationError } = await supabase
    .from('organizations')
    .select(
      `
        id,
        name,
        slug,
        description,
        logo_url,
        status,
        created_by,
        created_at,
        updated_at
      `
    )
    .eq('id', organizationId)
    .maybeSingle()

  if (organizationError || !organizationData) {
    notFound()
  }

  const organization = organizationData as Organization

  // ==========================================================
  // REAL ORGANIZATION DATA
  // ==========================================================

  const [tasksResult, activityResult, tournamentsResult] = await Promise.all([
    supabase
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
      .eq('organization_id', organizationId)
      .in('status', ['open', 'in_progress'])
      .order('due_at', {
        ascending: true,
        nullsFirst: false,
      })
      .limit(10),

    supabase
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
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(8),

    supabase
      .from('tournaments')
      .select(
        `
          id,
          status
        `
      )
      .eq('organization_id', organizationId),
  ])

  const tasks = (tasksResult.data ?? []) as Task[]
  const activity = (activityResult.data ?? []) as AuditLog[]
  const tournaments = (tournamentsResult.data ?? []) as Tournament[]

  // ==========================================================
  // DISPLAY
  // ==========================================================

  const displayName =
    profile?.display_name?.trim() ||
    profile?.full_name?.trim() ||
    user.email?.split('@')[0] ||
    'User'

  const initial = displayName.charAt(0).toUpperCase() || 'U'

  const organizationInitial =
    organization.name.charAt(0).toUpperCase() || 'K'

  const canManageOrganization =
    membership.role === 'owner' || membership.role === 'admin'

  const canManageOperations =
    membership.role === 'owner' ||
    membership.role === 'admin' ||
    membership.role === 'manager'

  const overdueTasks = tasks.filter((task) => isOverdue(task.due_at))

  const activeTournaments = tournaments.filter((tournament) =>
    ['registration', 'scheduled', 'live'].includes(tournament.status)
  ).length

  const completedTournaments = tournaments.filter(
    (tournament) => tournament.status === 'completed'
  ).length

  const hasWorkspaceDataError = Boolean(
    tasksResult.error ||
      activityResult.error ||
      tournamentsResult.error
  )

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-[#081f49]">
      {/* ======================================================
          DESKTOP SIDEBAR
          ====================================================== */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
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

        {/* ORGANIZATION */}

        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            {organization.logo_url ? (
              <Image
                src={organization.logo_url}
                alt={organization.name}
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0057ff] to-[#00ceef] font-extrabold text-white">
                {organizationInitial}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">
                {organization.name}
              </p>

              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#0057ff]">
                {formatRole(membership.role)}
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav
          aria-label="Organization navigation"
          className="flex-1 overflow-y-auto px-3 py-5"
        >
          <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>

          <div className="space-y-1">
            <Link
              href={`/organizations/${organization.id}`}
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

              Overview
            </Link>

            {/* REAL TOURNAMENT LINK */}

            <Link
              href={`/organizations/${organization.id}/tournaments`}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#0057ff]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[19px] w-[19px] fill-none stroke-current"
                strokeWidth="1.9"
              >
                <path d="M8 4h8l2 4-2 4H8L6 8l2-4Z" />
                <path d="M12 12v8" />
                <path d="M8 20h8" />
              </svg>

              Tournaments

              {tournaments.length > 0 && (
                <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold text-[#0057ff]">
                  {tournaments.length}
                </span>
              )}
            </Link>

            <div className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-300">
              <svg
                viewBox="0 0 24 24"
                className="h-[19px] w-[19px] fill-none stroke-current"
                strokeWidth="1.9"
              >
                <circle cx="8" cy="8" r="3" />
                <circle cx="16" cy="8" r="3" />
                <path d="M3 20c0-3 2-6 5-6s5 3 5 6" />
                <path d="M11 20c0-3 2-6 5-6s5 3 5 6" />
              </svg>

              Members
            </div>

            <div className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-300">
              <svg
                viewBox="0 0 24 24"
                className="h-[19px] w-[19px] fill-none stroke-current"
                strokeWidth="1.9"
              >
                <path d="M4 19V9" />
                <path d="M10 19V5" />
                <path d="M16 19v-7" />
                <path d="M22 19H2" />
              </svg>

              Reports
            </div>
          </div>

          <p className="mb-2 mt-8 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            Organization
          </p>

          <div className="space-y-1">
            {canManageOrganization ? (
              <div className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-400">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[19px] w-[19px] fill-none stroke-current"
                  strokeWidth="1.9"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
                </svg>

                Settings
              </div>
            ) : (
              <div className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-300">
                Settings
              </div>
            )}
          </div>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <Link
            href="/dashboard"
            className="flex min-h-[42px] items-center gap-2 rounded-xl px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-[#0057ff]"
          >
            ← Back to My Kulhivaru
          </Link>
        </div>
      </aside>

      {/* ======================================================
          MAIN APPLICATION
          ====================================================== */}

      <div className="lg:pl-[260px]">
        {/* HEADER */}

        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
          <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
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
                Organization Workspace
              </p>

              <p className="mt-1 truncate text-sm font-extrabold">
                {organization.name}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span
                className={`hidden rounded-full px-3 py-1 text-[10px] font-extrabold uppercase sm:inline-flex ${
                  organization.status === 'active'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {organization.status}
              </span>

              <Link
                href="/notifications"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-[#0057ff]"
                aria-label="Notifications"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-[18px] w-[18px] fill-none stroke-current"
                  strokeWidth="1.9"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
              </Link>

              <Link
                href="/settings/profile"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl"
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
            MAIN CONTENT
            ==================================================== */}

        <main className="mx-auto max-w-[1450px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {hasWorkspaceDataError && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4"
            >
              <p className="text-sm font-bold text-red-700">
                Some workspace information could not be loaded.
              </p>

              <p className="mt-1 text-xs text-red-500">
                Refresh the page to try again.
              </p>
            </div>
          )}

          {/* BREADCRUMB */}

          <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link
              href="/dashboard"
              className="transition hover:text-[#0057ff]"
            >
              My Kulhivaru
            </Link>

            <span>/</span>

            <span className="truncate text-[#081f49]">
              {organization.name}
            </span>
          </div>

          {/* HERO */}

          <section className="relative mb-6 overflow-hidden rounded-[26px] bg-[#081f49] p-6 text-white shadow-[0_18px_45px_rgba(8,31,73,0.14)] sm:p-8">
            <Image
              src="/branding/kulhivaru-icon-mark.png"
              alt=""
              width={260}
              height={260}
              loading="eager"
              className="pointer-events-none absolute -bottom-20 -right-12 h-64 w-64 rotate-[-14deg] object-contain opacity-[0.06]"
            />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex items-start gap-4">
                {organization.logo_url ? (
                  <Image
                    src={organization.logo_url}
                    alt={organization.name}
                    width={74}
                    height={74}
                    className="h-[74px] w-[74px] shrink-0 rounded-2xl border border-white/20 object-cover"
                  />
                ) : (
                  <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0057ff] to-[#00ceef] text-2xl font-extrabold text-white">
                    {organizationInitial}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#00ceef]">
                      {formatRole(membership.role)}
                    </span>

                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-extrabold uppercase text-emerald-300">
                      {organization.status}
                    </span>
                  </div>

                  <h1 className="mt-3 break-words text-[28px] font-extrabold tracking-tight sm:text-[36px]">
                    {organization.name}
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                    {organization.description?.trim() ||
                      'Manage this organization and its sports operations from one workspace.'}
                  </p>
                </div>
              </div>

              {canManageOperations && (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/organizations/${organization.id}/tournaments`}
                    className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-[#0057ff] px-5 text-sm font-extrabold text-white transition hover:bg-[#004de0]"
                  >
                    Manage Tournaments →
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* ==================================================
              SUMMARY
              ================================================== */}

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Tournaments
              </p>

              <p className="mt-3 text-[30px] font-extrabold">
                {tournaments.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Total competitions
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Active Tournaments
              </p>

              <p className="mt-3 text-[30px] font-extrabold">
                {activeTournaments}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Registration, scheduled or live
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Open Tasks
              </p>

              <p className="mt-3 text-[30px] font-extrabold">
                {tasks.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {overdueTasks.length > 0
                  ? `${overdueTasks.length} overdue`
                  : 'Organization workload'}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Your Role
              </p>

              <p className="mt-3 text-xl font-extrabold">
                {formatRole(membership.role)}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Joined {formatDate(membership.joined_at) ?? '—'}
              </p>
            </article>
          </section>

          {/* ==================================================
              WORKSPACE
              ================================================== */}

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              {/* TOURNAMENTS */}

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0057ff]">
                      Competition Management
                    </p>

                    <h2 className="mt-1 text-lg font-extrabold">
                      Tournaments
                    </h2>
                  </div>

                  <Link
                    href={`/organizations/${organization.id}/tournaments`}
                    className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-4 text-xs font-extrabold text-[#0057ff] transition hover:bg-blue-100"
                  >
                    View Tournaments →
                  </Link>
                </div>

                <div className="px-5 py-7 sm:px-6">
                  {tournaments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0057ff] to-[#00ceef] text-xl text-white">
                        ⚽
                      </div>

                      <h3 className="mt-4 text-lg font-extrabold">
                        No tournaments yet
                      </h3>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Create your first Football or Futsal tournament and
                        begin configuring the competition.
                      </p>

                      {canManageOperations && (
                        <Link
                          href={`/organizations/${organization.id}/tournaments/new`}
                          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#0057ff] px-5 text-sm font-extrabold text-white transition hover:bg-[#004de0]"
                        >
                          + Create Tournament
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Total
                        </p>

                        <p className="mt-2 text-2xl font-extrabold">
                          {tournaments.length}
                        </p>
                      </div>

                      <div className="rounded-xl bg-blue-50 p-4">
                        <p className="text-[10px] font-bold uppercase text-blue-400">
                          Active
                        </p>

                        <p className="mt-2 text-2xl font-extrabold text-[#0057ff]">
                          {activeTournaments}
                        </p>
                      </div>

                      <div className="rounded-xl bg-emerald-50 p-4">
                        <p className="text-[10px] font-bold uppercase text-emerald-500">
                          Completed
                        </p>

                        <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                          {completedTournaments}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* TASKS */}

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <h2 className="text-lg font-extrabold">
                    Organization Tasks
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Current actionable work
                  </p>
                </div>

                {tasks.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm font-bold">
                      No open tasks
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Organization tasks will appear here when created.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {tasks.map((task) => {
                      const overdue = isOverdue(task.due_at)

                      return (
                        <div
                          key={task.id}
                          className="px-5 py-4 sm:px-6"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold">
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

                              {task.description && (
                                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                                  {task.description}
                                </p>
                              )}

                              <p className="mt-2 text-[11px] text-slate-400">
                                {formatLabel(task.status)}
                                {task.due_at
                                  ? ` • Due ${formatDate(task.due_at)}`
                                  : ''}
                              </p>
                            </div>
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
              {/* QUICK ACTIONS */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0057ff]">
                  Workspace
                </p>

                <h2 className="mt-1 text-lg font-extrabold">
                  Quick Actions
                </h2>

                <div className="mt-4 space-y-2">
                  {canManageOperations && (
                    <Link
                      href={`/organizations/${organization.id}/tournaments/new`}
                      className="flex min-h-[48px] items-center justify-between rounded-xl bg-blue-50 px-4 text-sm font-bold text-[#0057ff] transition hover:bg-blue-100"
                    >
                      <span>Create Tournament</span>
                      <span>→</span>
                    </Link>
                  )}

                  <Link
                    href={`/organizations/${organization.id}/tournaments`}
                    className="flex min-h-[48px] items-center justify-between rounded-xl px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-[#0057ff]"
                  >
                    <span>View Tournaments</span>
                    <span>→</span>
                  </Link>

                  {canManageOrganization && (
                    <div className="flex min-h-[48px] items-center justify-between rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-400">
                      <span>Manage Members</span>
                      <span>Upcoming</span>
                    </div>
                  )}

                  <Link
                    href="/dashboard"
                    className="flex min-h-[48px] items-center justify-between rounded-xl px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-[#0057ff]"
                  >
                    <span>My Kulhivaru</span>
                    <span>→</span>
                  </Link>
                </div>
              </section>

              {/* ORGANIZATION INFO */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
                <h2 className="text-base font-extrabold">
                  Organization
                </h2>

                <dl className="mt-4 space-y-4">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Name
                    </dt>

                    <dd className="mt-1 break-words text-sm font-bold">
                      {organization.name}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Slug
                    </dt>

                    <dd className="mt-1 break-all text-sm font-semibold text-slate-600">
                      {organization.slug}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Status
                    </dt>

                    <dd className="mt-1 text-sm font-bold capitalize">
                      {organization.status}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Your Access
                    </dt>

                    <dd className="mt-1 text-sm font-bold">
                      {formatRole(membership.role)}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* ACTIVITY */}

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="text-base font-extrabold">
                    Recent Activity
                  </h2>
                </div>

                {activity.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-xs text-slate-400">
                      No organization activity yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activity.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 p-4"
                      >
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#00bce9]" />

                        <div className="min-w-0">
                          <p className="text-xs font-bold">
                            {formatLabel(item.action)}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            {formatDateTime(item.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          <div className="h-20 lg:hidden" />
        </main>

        {/* ====================================================
            MOBILE NAVIGATION
            ==================================================== */}

        <nav
          aria-label="Mobile organization navigation"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
        >
          <div className="mx-auto grid max-w-md grid-cols-4">
            <Link
              href={`/organizations/${organization.id}`}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-[#0057ff]"
            >
              <span className="text-lg leading-none">⌂</span>

              <span className="text-[10px] font-semibold">
                Overview
              </span>
            </Link>

            <Link
              href={`/organizations/${organization.id}/tournaments`}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-slate-400 transition hover:text-[#0057ff]"
            >
              <span className="text-lg leading-none">⚽</span>

              <span className="text-[10px] font-semibold">
                Tournaments
              </span>
            </Link>

            <div className="flex flex-col items-center gap-1 rounded-xl py-2 text-slate-300">
              <span className="text-lg leading-none">◎</span>

              <span className="text-[10px] font-semibold">
                Members
              </span>
            </div>

            <Link
              href="/dashboard"
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-slate-400"
            >
              <span className="text-lg leading-none">←</span>

              <span className="text-[10px] font-semibold">
                My Kulhivaru
              </span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
}