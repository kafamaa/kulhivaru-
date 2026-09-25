import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { createTournamentAction } from './actions'

type PageProps = {
  params: Promise<{
    organizationId: string
  }>

  searchParams: Promise<{
    error?: string
  }>
}

type Sport = {
  id: string
  name: string
  slug: string
}

function getErrorMessage(error?: string) {
  switch (error) {
    case 'invalid-name':
      return 'Enter a valid tournament name.'

    case 'missing-sport':
      return 'Select a sport for this tournament.'

    case 'invalid-sport':
      return 'The selected sport is not available.'

    case 'invalid-dates':
      return 'The tournament end date cannot be before the start date.'

    case 'invalid-visibility':
      return 'Select a valid tournament visibility.'

    case 'settings-failed':
      return 'Tournament settings could not be created. The incomplete tournament was removed.'

    case 'membership-failed':
      return 'Tournament administrator access could not be created. The incomplete tournament was removed.'

    case 'create-failed':
      return 'The tournament could not be created. Please try again.'

    default:
      return null
  }
}

export default async function NewTournamentPage({
  params,
  searchParams,
}: PageProps) {
  const { organizationId } = await params
  const { error } = await searchParams

  const errorMessage = getErrorMessage(error)

  const supabase = await createClient()

  // ==========================================================
  // AUTHENTICATED USER
  // ==========================================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // ==========================================================
  // ORGANIZATION
  // ==========================================================

  const {
    data: organization,
    error: organizationError,
  } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      status
    `)
    .eq('id', organizationId)
    .maybeSingle()

  if (organizationError || !organization) {
    redirect('/dashboard')
  }

  if (organization.status !== 'active') {
    redirect('/dashboard')
  }

  // ==========================================================
  // ORGANIZATION MEMBERSHIP
  // ==========================================================

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from('organization_members')
    .select(`
      id,
      role,
      status
    `)
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (
    membershipError ||
    !membership ||
    !['owner', 'admin', 'manager'].includes(membership.role)
  ) {
    redirect(`/organizations/${organizationId}`)
  }

  // ==========================================================
  // ACTIVE SPORTS
  // ==========================================================

  const {
    data: sportData,
    error: sportsError,
  } = await supabase
    .from('sports')
    .select(`
      id,
      name,
      slug
    `)
    .eq('status', 'active')
    .order('name', {
      ascending: true,
    })

  if (sportsError) {
    console.error(
      'Failed to load sports:',
      sportsError
    )
  }

  const sports = (sportData ?? []) as Sport[]

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-[#081f49]">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-[72px] max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
          <div>
            <Link
              href="/dashboard"
              className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0057ff]"
            >
              Kulhivaru+
            </Link>

            <p className="mt-1 text-sm font-extrabold text-[#081f49]">
              {organization.name}
            </p>
          </div>

          <Link
            href={`/organizations/${organizationId}/tournaments`}
            className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:text-[#0057ff]"
          >
            ← Tournaments
          </Link>
        </div>
      </header>

      {/* ======================================================
          CONTENT
          ====================================================== */}

      <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-[760px]">
          {/* ==================================================
              PAGE TITLE
              ================================================== */}

          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#0057ff]">
              New Competition
            </div>

            <h1 className="text-3xl font-black tracking-tight text-[#081f49] sm:text-4xl">
              Create Tournament
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Create the tournament foundation now. Teams,
              competition format, fixtures, rules and match
              operations can be configured from the tournament
              workspace afterward.
            </p>
          </div>

          {/* ==================================================
              ERROR MESSAGE
              ================================================== */}

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-600">
                  !
                </div>

                <div>
                  <p className="text-sm font-extrabold text-red-700">
                    Tournament was not created
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-600">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              FORM
              ================================================== */}

          <form
            action={createTournamentAction}
            className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(8,31,73,0.06)]"
          >
            <input
              type="hidden"
              name="organization_id"
              value={organizationId}
            />

            {/* =================================================
                SECTION 01
                BASIC INFORMATION
                ================================================= */}

            <section className="border-b border-slate-100 p-6 sm:p-8">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0057ff]">
                  01 · Basic Information
                </p>

                <h2 className="mt-2 text-lg font-black text-[#081f49]">
                  Tournament details
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Give your competition its basic identity.
                </p>
              </div>

              <div className="mt-6 space-y-5">
                {/* TOURNAMENT NAME */}

                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-xs font-extrabold text-[#081f49]"
                  >
                    Tournament name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    maxLength={160}
                    autoComplete="off"
                    placeholder="Example: Kulhivaru Championship 2026"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#081f49] outline-none transition placeholder:text-slate-300 focus:border-[#0057ff] focus:ring-4 focus:ring-blue-50"
                  />

                  <p className="mt-2 text-[11px] leading-5 text-slate-400">
                    Maximum 160 characters.
                  </p>
                </div>

                {/* SPORT */}

                <div>
                  <label
                    htmlFor="sport_id"
                    className="mb-2 block text-xs font-extrabold text-[#081f49]"
                  >
                    Sport
                  </label>

                  <select
                    id="sport_id"
                    name="sport_id"
                    required
                    defaultValue=""
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#081f49] outline-none transition focus:border-[#0057ff] focus:ring-4 focus:ring-blue-50"
                  >
                    <option
                      value=""
                      disabled
                    >
                      Select sport
                    </option>

                    {sports.map((sport) => (
                      <option
                        key={sport.id}
                        value={sport.id}
                      >
                        {sport.name}
                      </option>
                    ))}
                  </select>

                  {sports.length === 0 && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-bold text-amber-700">
                        No active sports are currently available.
                      </p>
                    </div>
                  )}
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-xs font-extrabold text-[#081f49]"
                  >
                    Description

                    <span className="ml-1 font-medium text-slate-400">
                      optional
                    </span>
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Short description about this tournament..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-[#081f49] outline-none transition placeholder:text-slate-300 focus:border-[#0057ff] focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {/* SEASON */}

                <div>
                  <label
                    htmlFor="season_label"
                    className="mb-2 block text-xs font-extrabold text-[#081f49]"
                  >
                    Season

                    <span className="ml-1 font-medium text-slate-400">
                      optional
                    </span>
                  </label>

                  <input
                    id="season_label"
                    name="season_label"
                    type="text"
                    autoComplete="off"
                    placeholder="Example: 2026"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#081f49] outline-none transition placeholder:text-slate-300 focus:border-[#0057ff] focus:ring-4 focus:ring-blue-50"
                  />

                  <p className="mt-2 text-[11px] leading-5 text-slate-400">
                    Examples: 2026, Season 3, 2026/27.
                  </p>
                </div>
              </div>
            </section>

            {/* =================================================
                SECTION 02
                SCHEDULE
                ================================================= */}

            <section className="border-b border-slate-100 p-6 sm:p-8">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0057ff]">
                02 · Schedule
              </p>

              <h2 className="mt-2 text-lg font-black text-[#081f49]">
                Tournament dates
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Dates are optional. You can change them later from
                tournament settings.
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {/* START DATE */}

                <div>
                  <label
                    htmlFor="start_date"
                    className="mb-2 block text-xs font-extrabold text-[#081f49]"
                  >
                    Start date
                  </label>

                  <input
                    id="start_date"
                    name="start_date"
                    type="date"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#081f49] outline-none transition focus:border-[#0057ff] focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {/* END DATE */}

                <div>
                  <label
                    htmlFor="end_date"
                    className="mb-2 block text-xs font-extrabold text-[#081f49]"
                  >
                    End date
                  </label>

                  <input
                    id="end_date"
                    name="end_date"
                    type="date"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#081f49] outline-none transition focus:border-[#0057ff] focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              {/* TIMEZONE */}

              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                  Tournament timezone
                </p>

                <p className="mt-1 text-sm font-extrabold text-[#081f49]">
                  Indian/Maldives
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  Timezone management can be expanded later from
                  tournament settings.
                </p>
              </div>
            </section>

            {/* =================================================
                SECTION 03
                VISIBILITY
                ================================================= */}

            <section className="p-6 sm:p-8">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0057ff]">
                03 · Access
              </p>

              <h2 className="mt-2 text-lg font-black text-[#081f49]">
                Tournament visibility
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Control how the tournament can eventually be
                accessed.
              </p>

              <div className="mt-6">
                <label
                  htmlFor="visibility"
                  className="mb-2 block text-xs font-extrabold text-[#081f49]"
                >
                  Visibility
                </label>

                <select
                  id="visibility"
                  name="visibility"
                  defaultValue="private"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#081f49] outline-none transition focus:border-[#0057ff] focus:ring-4 focus:ring-blue-50"
                >
                  <option value="private">
                    Private — organization members only
                  </option>

                  <option value="unlisted">
                    Unlisted — accessible with link
                  </option>

                  <option value="public">
                    Public — publicly visible
                  </option>
                </select>
              </div>

              {/* DRAFT INFORMATION */}

              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-[#0057ff]">
                    i
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-[#0057ff]">
                      Tournament starts as Draft
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Creating this tournament will not
                      automatically start or publish the
                      competition. You will configure the
                      tournament first.
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  ACTIONS
                  ================================================= */}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-end">
                <Link
                  href={`/organizations/${organizationId}/tournaments`}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={sports.length === 0}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#0057ff] px-7 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(0,87,255,0.22)] transition hover:-translate-y-0.5 hover:bg-[#004de0] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  Create Tournament

                  <span className="ml-2">
                    →
                  </span>
                </button>
              </div>
            </section>
          </form>

          {/* ==================================================
              FOOT NOTE
              ================================================== */}

          <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">
            After creation you will be taken directly to the
            tournament workspace to continue setup.
          </p>
        </div>
      </div>
    </main>
  )
}