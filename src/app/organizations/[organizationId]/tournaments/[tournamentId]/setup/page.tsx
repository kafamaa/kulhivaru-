import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateTournamentSetupAction } from './actions'

type Props = {
  params: Promise<{ organizationId: string; tournamentId: string }>
  searchParams: Promise<{ error?: string; saved?: string }>
}

function localDateTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function errorMessage(code?: string) {
  const messages: Record<string, string> = {
    'invalid-name': 'Enter a valid tournament name.',
    'invalid-dates': 'End date cannot be before the start date.',
    'invalid-registration-dates': 'Registration closing time cannot be before opening time.',
    'invalid-visibility': 'Select a valid visibility.',
    'invalid-status': 'Select a valid tournament status.',
    'invalid-rules': 'Check the competition rule values and ranges.',
    'save-failed': 'The tournament setup could not be saved. Please try again.',
  }
  return code ? messages[code] ?? 'Something went wrong.' : null
}

const input = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#081f49] outline-none transition focus:border-[#0057ff] focus:ring-4 focus:ring-blue-50'
const label = 'text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500'

export default async function TournamentSetupPage({ params, searchParams }: Props) {
  const { organizationId, tournamentId } = await params
  const query = await searchParams
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role, status')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) notFound()
  if (!['owner', 'admin', 'manager'].includes(membership.role)) {
    redirect(`/organizations/${organizationId}/tournaments/${tournamentId}`)
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .maybeSingle()
  if (!organization) notFound()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, description, season_label, start_date, end_date, registration_opens_at, registration_closes_at, timezone, visibility, status, sports(name)')
    .eq('id', tournamentId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (!tournament) notFound()

  const { data: settings } = await supabase
    .from('tournament_settings')
    .select('points_for_win, points_for_draw, points_for_loss, allow_draws, extra_time_enabled, penalties_enabled, match_duration_minutes, period_count, squad_min, squad_max, lineup_min, lineup_max, substitutions_max')
    .eq('tournament_id', tournamentId)
    .maybeSingle()

  const sportRelation = tournament.sports as { name: string } | { name: string }[] | null
  const sport = Array.isArray(sportRelation) ? sportRelation[0]?.name : sportRelation?.name
  const message = errorMessage(query.error)

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-[#081f49]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-[72px] max-w-[1250px] items-center px-4 sm:px-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Tournament Setup</p>
            <p className="mt-1 font-black">{tournament.name}</p>
          </div>
          <Link href={`/organizations/${organizationId}/tournaments/${tournamentId}`} className="ml-auto rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-[#0057ff]">← Workspace</Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1250px] px-4 py-7 sm:px-6">
        <div className="mb-6">
          <p className="text-xs font-bold text-[#0057ff]">{organization.name} / {sport ?? 'Tournament'}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Configure tournament</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage tournament information, schedule, registration, visibility, competition scoring and match rules.</p>
        </div>

        {query.saved === '1' && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">Tournament setup saved successfully.</div>}
        {message && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{message}</div>}

        <form action={updateTournamentSetupAction} className="space-y-6">
          <input type="hidden" name="organization_id" value={organizationId} />
          <input type="hidden" name="tournament_id" value={tournamentId} />

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0057ff]">General</p>
            <h2 className="mt-2 text-xl font-black">Tournament information</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className={label}>Tournament name<input className={input} name="name" defaultValue={tournament.name} maxLength={160} required /></label>
              <label className={label}>Season label<input className={input} name="season_label" defaultValue={tournament.season_label ?? ''} placeholder="2026 Season" /></label>
              <label className={`${label} md:col-span-2`}>Description<textarea className={`${input} min-h-28 resize-y`} name="description" defaultValue={tournament.description ?? ''} placeholder="Tournament description" /></label>
              <label className={label}>Timezone<input className={input} name="timezone" defaultValue={tournament.timezone || 'Indian/Maldives'} required /></label>
              <label className={label}>Visibility<select className={input} name="visibility" defaultValue={tournament.visibility}><option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select></label>
              <label className={label}>Status<select className={input} name="status" defaultValue={tournament.status}><option value="draft">Draft</option><option value="registration">Registration</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="archived">Archived</option></select></label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0057ff]">Schedule</p>
            <h2 className="mt-2 text-xl font-black">Dates & registration</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className={label}>Start date<input className={input} type="date" name="start_date" defaultValue={tournament.start_date ?? ''} /></label>
              <label className={label}>End date<input className={input} type="date" name="end_date" defaultValue={tournament.end_date ?? ''} /></label>
              <label className={label}>Registration opens<input className={input} type="datetime-local" name="registration_opens_at" defaultValue={localDateTime(tournament.registration_opens_at)} /></label>
              <label className={label}>Registration closes<input className={input} type="datetime-local" name="registration_closes_at" defaultValue={localDateTime(tournament.registration_closes_at)} /></label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0057ff]">Competition</p>
            <h2 className="mt-2 text-xl font-black">Scoring & match rules</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className={label}>Win points<input className={input} type="number" min="0" step="0.001" name="points_for_win" defaultValue={settings?.points_for_win ?? 3} required /></label>
              <label className={label}>Draw points<input className={input} type="number" min="0" step="0.001" name="points_for_draw" defaultValue={settings?.points_for_draw ?? 1} required /></label>
              <label className={label}>Loss points<input className={input} type="number" min="0" step="0.001" name="points_for_loss" defaultValue={settings?.points_for_loss ?? 0} required /></label>
              <label className={label}>Match duration (minutes)<input className={input} type="number" min="1" name="match_duration_minutes" defaultValue={settings?.match_duration_minutes ?? ''} /></label>
              <label className={label}>Periods<input className={input} type="number" min="1" name="period_count" defaultValue={settings?.period_count ?? ''} /></label>
              <label className={label}>Maximum substitutions<input className={input} type="number" min="0" name="substitutions_max" defaultValue={settings?.substitutions_max ?? ''} /></label>
              <label className={label}>Squad minimum<input className={input} type="number" min="0" name="squad_min" defaultValue={settings?.squad_min ?? ''} /></label>
              <label className={label}>Squad maximum<input className={input} type="number" min="1" name="squad_max" defaultValue={settings?.squad_max ?? ''} /></label>
              <label className={label}>Lineup minimum<input className={input} type="number" min="0" name="lineup_min" defaultValue={settings?.lineup_min ?? ''} /></label>
              <label className={label}>Lineup maximum<input className={input} type="number" min="1" name="lineup_max" defaultValue={settings?.lineup_max ?? ''} /></label>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[['allow_draws', 'Allow draws', settings?.allow_draws ?? true], ['extra_time_enabled', 'Enable extra time', settings?.extra_time_enabled ?? false], ['penalties_enabled', 'Enable penalties', settings?.penalties_enabled ?? false]].map(([name, title, checked]) => (
                <label key={String(name)} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold">
                  <input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} className="h-5 w-5 accent-[#0057ff]" />
                  {String(title)}
                </label>
              ))}
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link href={`/organizations/${organizationId}/tournaments/${tournamentId}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600">Cancel</Link>
            <button type="submit" className="min-h-12 rounded-xl bg-[#0057ff] px-7 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-[#0047d8]">Save Tournament Setup</button>
          </div>
        </form>
      </main>
    </div>
  )
}
