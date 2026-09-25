import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Organization = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  status: string
}

type Membership = {
  id: string
  organization_id: string
  user_id: string
  role: string
  status: string
}

type Sport = {
  id: string
  name: string
  slug: string
}

type Tournament = {
  id: string
  organization_id: string
  sport_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  season_label: string | null
  start_date: string | null
  end_date: string | null
  registration_opens_at: string | null
  registration_closes_at: string | null
  timezone: string
  visibility: string
  status: string
  created_at: string
  sports: Sport | Sport[] | null
}

function getSport(tournament: Tournament) {
  if (Array.isArray(tournament.sports)) {
    return tournament.sports[0] ?? null
  }

  return tournament.sports
}

function formatRole(role: string) {
  return role
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatStatus(status: string) {
  return status
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string | null) {
  if (!value) return null

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function statusClasses(status: string) {
  switch (status) {
    case 'live':
      return 'bg-red-50 text-red-600 ring-red-100'

    case 'registration':
      return 'bg-cyan-50 text-cyan-700 ring-cyan-100'

    case 'scheduled':
      return 'bg-blue-50 text-[#0057ff] ring-blue-100'

    case 'completed':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100'

    case 'cancelled':
      return 'bg-red-50 text-red-500 ring-red-100'

    case 'archived':
      return 'bg-slate-100 text-slate-500 ring-slate-200'

    default:
      return 'bg-amber-50 text-amber-700 ring-amber-100'
  }
}

export default async function TournamentsPage({
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
  // ORGANIZATION MEMBERSHIP
  // ==========================================================

  const { data: membershipData, error: membershipError } = await supabase
    .from('organization_members')
    .select(
      `
        id,
        organization_id,
        user_id,
        role,
        status
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
        logo_url,
        status
      `
    )
    .eq('id', organizationId)
    .maybeSingle()

  if (organizationError || !organizationData) {
    notFound()
  }

  const organization = organizationData as Organization

  // ==========================================================
  // TOURNAMENTS
  // ==========================================================

  const { data: tournamentData, error: tournamentError } = await supabase
    .from('tournaments')
    .select(
      `
        id,
        organization_id,
        sport_id,
        name,
        slug,
        description,
        logo_url,
        cover_url,
        season_label,
        start_date,
        end_date,
        registration_opens_at,
        registration_closes_at,
        timezone,
        visibility,
        status,
        created_at,
        sports (
          id,
          name,
          slug
        )
      `
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  const tournaments = (tournamentData ?? []) as Tournament[]

  const canCreateTournament =
    membership.role === 'owner' ||
    membership.role === 'admin' ||
    membership.role === 'manager'

  const displayName =
    profile?.display_name?.trim() ||
    profile?.full_name?.trim() ||
    user.email?.split('@')[0] ||
    'User'

  const userInitial = displayName.charAt(0).toUpperCase() || 'U'
  const organizationInitial =
    organization.name.charAt(0).toUpperCase() || 'K'

  const liveCount = tournaments.filter(
    (tournament) => tournament.status === 'live'
  ).length

  const upcomingCount = tournaments.filter((tournament) =>
    ['registration', 'scheduled'].includes(tournament.status)
  ).length

  const completedCount = tournaments.filter(
    (tournament) => tournament.status === 'completed'
  ).length

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-[#081f49]">
      {/* ======================================================
          SIDEBAR
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

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>

          <div className="space-y-1">
            <Link
              href={`/organizations/${organization.id}`}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#0057ff]"
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

            <Link
              href={`/organizations/${organization.id}/tournaments`}
              className="flex min-h-[44px] items-center gap-3 rounded-xl bg-gradient-to-r from-[#0057ff]/10 to-[#00ceef]/[0.08] px-3 text-sm font-bold text-[#0057ff]"
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
          CONTENT
          ====================================================== */}

      <div className="lg:pl-[260px]">
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
                Competition Management
              </p>

              <p className="mt-1 truncate text-sm font-extrabold">
                {organization.name}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
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
                    {userInitial}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1450px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* BREADCRUMB */}

          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
            <Link
              href="/dashboard"
              className="transition hover:text-[#0057ff]"
            >
              My Kulhivaru
            </Link>

            <span>/</span>

            <Link
              href={`/organizations/${organization.id}`}
              className="transition hover:text-[#0057ff]"
            >
              {organization.name}
            </Link>

            <span>/</span>

            <span className="text-[#081f49]">Tournaments</span>
          </div>

          {/* PAGE HEADER */}

          <section className="mb-6 flex flex-col gap-5 rounded-[26px] bg-[#081f49] p-6 text-white shadow-[0_18px_45px_rgba(8,31,73,0.14)] sm:p-8 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#00ceef]">
                Competition Management
              </p>

              <h1 className="mt-2 text-[30px] font-extrabold tracking-tight sm:text-[38px]">
                Tournaments
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                Create and manage competitions for {organization.name}.
              </p>
            </div>

            {canCreateTournament && (
              <Link
                href={`/organizations/${organization.id}/tournaments/new`}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 self-start rounded-xl bg-[#0057ff] px-5 text-sm font-extrabold text-white transition hover:bg-[#004de0] xl:self-auto"
              >
                <span className="text-lg">+</span>
                Create Tournament
              </Link>
            )}
          </section>

          {/* ERROR */}

          {tournamentError && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4"
            >
              <p className="text-sm font-bold text-red-700">
                Tournaments could not be loaded.
              </p>

              <p className="mt-1 text-xs text-red-500">
                Refresh the page and try again.
              </p>
            </div>
          )}

          {/* REAL SUMMARY */}

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Total
              </p>

              <p className="mt-3 text-[30px] font-extrabold">
                {tournaments.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Tournaments
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Live
              </p>

              <p
                className={`mt-3 text-[30px] font-extrabold ${
                  liveCount > 0 ? 'text-red-600' : ''
                }`}
              >
                {liveCount}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Running now
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Upcoming
              </p>

              <p className="mt-3 text-[30px] font-extrabold">
                {upcomingCount}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Registration or scheduled
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                Completed
              </p>

              <p className="mt-3 text-[30px] font-extrabold">
                {completedCount}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Finished competitions
              </p>
            </article>
          </section>

          {/* ==================================================
              TOURNAMENT LIST
              ================================================== */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-extrabold">
                  All Tournaments
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {tournaments.length === 0
                    ? 'No competitions created yet'
                    : `${tournaments.length} competition${
                        tournaments.length === 1 ? '' : 's'
                      }`}
                </p>
              </div>
            </div>

            {!tournamentError && tournaments.length === 0 ? (
              <div className="px-5 py-14 text-center sm:px-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0057ff] to-[#00ceef] text-2xl text-white shadow-lg shadow-blue-500/10">
                  ⚽
                </div>

                <h3 className="mt-5 text-xl font-extrabold">
                  Create your first tournament
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Start a Football or Futsal competition. Once created, its
                  teams, competition structure, fixtures, matches, standings
                  and other tournament operations will be managed from its own
                  workspace.
                </p>

                {canCreateTournament && (
                  <Link
                    href={`/organizations/${organization.id}/tournaments/new`}
                    className="mt-6 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#0057ff] px-5 text-sm font-extrabold text-white transition hover:bg-[#004de0]"
                  >
                    <span className="text-lg">+</span>
                    Create Tournament
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
                {tournaments.map((tournament) => {
                  const sport = getSport(tournament)
                  const startDate = formatDate(tournament.start_date)
                  const endDate = formatDate(tournament.end_date)

                  return (
                    <Link
                      key={tournament.id}
                      href={`/organizations/${organization.id}/tournaments/${tournament.id}`}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_35px_rgba(8,31,73,0.08)]"
                    >
                      <div className="relative h-2 bg-gradient-to-r from-[#0057ff] to-[#00ceef]" />

                      <div className="p-5 sm:p-6">
                        <div className="flex items-start gap-4">
                          {tournament.logo_url ? (
                            <Image
                              src={tournament.logo_url}
                              alt={tournament.name}
                              width={58}
                              height={58}
                              className="h-[58px] w-[58px] shrink-0 rounded-xl border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-xl bg-[#081f49] text-xl font-extrabold text-white">
                              {tournament.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.05em] ring-1 ring-inset ${statusClasses(
                                  tournament.status
                                )}`}
                              >
                                {formatStatus(tournament.status)}
                              </span>

                              {sport && (
                                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.05em] text-slate-500">
                                  {sport.name}
                                </span>
                              )}

                              <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-bold uppercase text-slate-400">
                                {tournament.visibility}
                              </span>
                            </div>

                            <h3 className="mt-3 truncate text-lg font-extrabold transition group-hover:text-[#0057ff]">
                              {tournament.name}
                            </h3>

                            {tournament.season_label && (
                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                {tournament.season_label}
                              </p>
                            )}
                          </div>

                          <span className="mt-1 text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#0057ff]">
                            →
                          </span>
                        </div>

                        {tournament.description && (
                          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
                            {tournament.description}
                          </p>
                        )}

                        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-100 pt-4">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              Start
                            </p>

                            <p className="mt-1 text-xs font-bold">
                              {startDate ?? 'Not set'}
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              End
                            </p>

                            <p className="mt-1 text-xs font-bold">
                              {endDate ?? 'Not set'}
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              Timezone
                            </p>

                            <p className="mt-1 text-xs font-bold">
                              {tournament.timezone}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          <div className="h-20 lg:hidden" />
        </main>

        {/* MOBILE NAV */}

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-4">
            <Link
              href={`/organizations/${organization.id}`}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-slate-400"
            >
              <span className="text-lg leading-none">⌂</span>
              <span className="text-[10px] font-semibold">
                Overview
              </span>
            </Link>

            <Link
              href={`/organizations/${organization.id}/tournaments`}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-[#0057ff]"
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