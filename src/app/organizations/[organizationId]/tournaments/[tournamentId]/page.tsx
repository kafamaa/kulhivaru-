import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
  sports:
    | {
        id: string
        name: string
        slug: string
      }
    | {
        id: string
        name: string
        slug: string
      }[]
    | null
}

type Organization = {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

type Membership = {
  id: string
  role: string
  status: string
}

type Settings = {
  tournament_id: string
  points_for_win: number
  points_for_draw: number
  points_for_loss: number
  allow_draws: boolean
  extra_time_enabled: boolean
  penalties_enabled: boolean
  match_duration_minutes: number | null
  period_count: number | null
  squad_min: number | null
  squad_max: number | null
  lineup_min: number | null
  lineup_max: number | null
  substitutions_max: number | null
}

function formatLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string | null) {
  if (!value) return 'Not set'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getSport(tournament: Tournament) {
  if (Array.isArray(tournament.sports)) {
    return tournament.sports[0] ?? null
  }

  return tournament.sports
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

export default async function TournamentWorkspacePage({
  params,
}: {
  params: Promise<{
    organizationId: string
    tournamentId: string
  }>
}) {
  const { organizationId, tournamentId } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('id, role, status')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membership) {
    notFound()
  }

  const { data: organization, error: organizationError } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url')
    .eq('id', organizationId)
    .maybeSingle()

  if (organizationError || !organization) {
    notFound()
  }

  const { data: tournament, error: tournamentError } = await supabase
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
    .eq('id', tournamentId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (tournamentError || !tournament) {
    notFound()
  }

  const { data: settings } = await supabase
    .from('tournament_settings')
    .select(
      `
        tournament_id,
        points_for_win,
        points_for_draw,
        points_for_loss,
        allow_draws,
        extra_time_enabled,
        penalties_enabled,
        match_duration_minutes,
        period_count,
        squad_min,
        squad_max,
        lineup_min,
        lineup_max,
        substitutions_max
      `
    )
    .eq('tournament_id', tournamentId)
    .maybeSingle()

  const typedTournament = tournament as Tournament
  const typedOrganization = organization as Organization
  const typedMembership = membership as Membership
  const typedSettings = settings as Settings | null
  const sport = getSport(typedTournament)

  const canManage =
    typedMembership.role === 'owner' ||
    typedMembership.role === 'admin' ||
    typedMembership.role === 'manager'

  const organizationInitial =
    typedOrganization.name.charAt(0).toUpperCase() || 'K'

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-[#081f49]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-[74px] max-w-[1450px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard">
            <Image
              src="/branding/kulhivaru-full-logo.png"
              alt="Kulhivaru+"
              width={150}
              height={52}
              priority
              className="h-auto max-h-[44px] w-auto"
            />
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href={`/organizations/${typedOrganization.id}/tournaments`}
              className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:text-[#0057ff]"
            >
              ← Tournaments
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1450px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/dashboard" className="transition hover:text-[#0057ff]">
            My Kulhivaru
          </Link>

          <span>/</span>

          <Link
            href={`/organizations/${typedOrganization.id}`}
            className="transition hover:text-[#0057ff]"
          >
            {typedOrganization.name}
          </Link>

          <span>/</span>

          <Link
            href={`/organizations/${typedOrganization.id}/tournaments`}
            className="transition hover:text-[#0057ff]"
          >
            Tournaments
          </Link>

          <span>/</span>

          <span className="text-[#081f49]">{typedTournament.name}</span>
        </div>

        <section className="overflow-hidden rounded-[28px] bg-[#081f49] text-white shadow-[0_18px_45px_rgba(8,31,73,0.14)]">
          {typedTournament.cover_url && (
            <div className="relative h-44 w-full sm:h-56">
              <Image
                src={typedTournament.cover_url}
                alt=""
                fill
                className="object-cover opacity-45"
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                    {typedTournament.logo_url ? (
                      <Image
                        src={typedTournament.logo_url}
                        alt={typedTournament.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 object-cover"
                      />
                    ) : typedOrganization.logo_url ? (
                      <Image
                        src={typedOrganization.logo_url}
                        alt={typedOrganization.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 object-cover"
                      />
                    ) : (
                      <span className="text-lg font-black">
                        {organizationInitial}
                      </span>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ring-1 ${statusClasses(
                      typedTournament.status
                    )}`}
                  >
                    {formatLabel(typedTournament.status)}
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase text-white/70">
                    {sport?.name ?? 'Sport'}
                  </span>
                </div>

                <h1 className="mt-5 break-words text-3xl font-black tracking-tight sm:text-4xl">
                  {typedTournament.name}
                </h1>

                <p className="mt-2 text-sm text-white/60">
                  {typedTournament.season_label || 'No season label'}
                </p>

                {typedTournament.description && (
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">
                    {typedTournament.description}
                  </p>
                )}
              </div>

              {canManage && (
                <div className="flex flex-wrap gap-2">
                  <div className="rounded-xl bg-white/10 px-4 py-3 text-xs font-bold text-white/60">
                    Tournament setup is ready for the next module
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
              Sport
            </p>
            <p className="mt-3 text-lg font-black">
              {sport?.name ?? 'Not available'}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
              Starts
            </p>
            <p className="mt-3 text-lg font-black">
              {formatDate(typedTournament.start_date)}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
              Ends
            </p>
            <p className="mt-3 text-lg font-black">
              {formatDate(typedTournament.end_date)}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
              Visibility
            </p>
            <p className="mt-3 text-lg font-black">
              {formatLabel(typedTournament.visibility)}
            </p>
          </article>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#0057ff]">
                Competition Workspace
              </p>
              <h2 className="mt-2 text-xl font-black">
                Tournament modules
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                This tournament has been created successfully. The next
                development steps will connect registration, teams, players,
                competition structure, fixtures, match operations, standings,
                statistics and awards to this workspace.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                'Tournament Setup',
                'Registration',
                'Teams',
                'Players',
                'Groups & Stages',
                'Fixtures',
                'Matches',
                'Live Control',
                'Standings',
                'Statistics',
                'Awards',
                'Officials',
                'Venues',
                'News',
                'Sponsors',
                'Reports',
              ].map((item) => (
                <div
                  key={item}
                  className="flex min-h-[58px] items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4"
                >
                  <span className="text-sm font-bold">{item}</span>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">
                    Upcoming
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#0057ff]">
                Competition Rules
              </p>

              <h2 className="mt-2 text-lg font-black">
                Default settings
              </h2>

              {typedSettings ? (
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">Win points</dt>
                    <dd className="font-black">{typedSettings.points_for_win}</dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">Draw points</dt>
                    <dd className="font-black">{typedSettings.points_for_draw}</dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">Loss points</dt>
                    <dd className="font-black">{typedSettings.points_for_loss}</dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">Draws</dt>
                    <dd className="font-black">
                      {typedSettings.allow_draws ? 'Allowed' : 'Disabled'}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">Extra time</dt>
                    <dd className="font-black">
                      {typedSettings.extra_time_enabled ? 'Enabled' : 'Disabled'}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">Penalties</dt>
                    <dd className="font-black">
                      {typedSettings.penalties_enabled ? 'Enabled' : 'Disabled'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Tournament settings are not available.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(8,31,73,0.04)]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#0057ff]">
                Access
              </p>

              <h2 className="mt-2 text-lg font-black">
                Your tournament access
              </h2>

              <p className="mt-4 text-sm text-slate-500">
                Organization role
              </p>

              <p className="mt-1 text-base font-black">
                {formatLabel(typedMembership.role)}
              </p>

              <p className="mt-4 text-xs leading-5 text-slate-400">
                Authorization is enforced by the server and Supabase RLS.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
