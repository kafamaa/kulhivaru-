'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function nullableInt(formData: FormData, key: string) {
  const value = text(formData, key)
  if (!value) return null
  const number = Number(value)
  return Number.isInteger(number) ? number : Number.NaN
}

function numberValue(formData: FormData, key: string) {
  const value = text(formData, key)
  if (!value) return Number.NaN
  return Number(value)
}

export async function updateTournamentSetupAction(formData: FormData) {
  const supabase = await createClient()
  const organizationId = text(formData, 'organization_id')
  const tournamentId = text(formData, 'tournament_id')

  if (!organizationId || !tournamentId) redirect('/dashboard')

  const setupUrl = `/organizations/${organizationId}/tournaments/${tournamentId}/setup`
  const workspaceUrl = `/organizations/${organizationId}/tournaments/${tournamentId}`

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role, status')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership || !['owner', 'admin', 'manager'].includes(membership.role)) {
    redirect(workspaceUrl)
  }

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('id', tournamentId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!tournament) redirect(`/organizations/${organizationId}/tournaments`)

  const name = text(formData, 'name')
  const description = text(formData, 'description')
  const seasonLabel = text(formData, 'season_label')
  const startDate = text(formData, 'start_date')
  const endDate = text(formData, 'end_date')
  const registrationOpensAt = text(formData, 'registration_opens_at')
  const registrationClosesAt = text(formData, 'registration_closes_at')
  const timezone = text(formData, 'timezone') || 'Indian/Maldives'
  const visibility = text(formData, 'visibility')
  const status = text(formData, 'status')

  if (!name || name.length > 160) redirect(`${setupUrl}?error=invalid-name`)
  if (startDate && endDate && endDate < startDate) redirect(`${setupUrl}?error=invalid-dates`)
  if (registrationOpensAt && registrationClosesAt && registrationClosesAt < registrationOpensAt) {
    redirect(`${setupUrl}?error=invalid-registration-dates`)
  }
  if (!['private', 'unlisted', 'public'].includes(visibility)) redirect(`${setupUrl}?error=invalid-visibility`)
  if (!['draft', 'registration', 'scheduled', 'live', 'completed', 'cancelled', 'archived'].includes(status)) {
    redirect(`${setupUrl}?error=invalid-status`)
  }

  const pointsForWin = numberValue(formData, 'points_for_win')
  const pointsForDraw = numberValue(formData, 'points_for_draw')
  const pointsForLoss = numberValue(formData, 'points_for_loss')
  const matchDuration = nullableInt(formData, 'match_duration_minutes')
  const periodCount = nullableInt(formData, 'period_count')
  const squadMin = nullableInt(formData, 'squad_min')
  const squadMax = nullableInt(formData, 'squad_max')
  const lineupMin = nullableInt(formData, 'lineup_min')
  const lineupMax = nullableInt(formData, 'lineup_max')
  const substitutionsMax = nullableInt(formData, 'substitutions_max')

  const numericValues = [pointsForWin, pointsForDraw, pointsForLoss]
  const integerValues = [matchDuration, periodCount, squadMin, squadMax, lineupMin, lineupMax, substitutionsMax]
  if (numericValues.some((v) => !Number.isFinite(v) || v < 0) || integerValues.some((v) => v !== null && (!Number.isFinite(v) || v < 0))) {
    redirect(`${setupUrl}?error=invalid-rules`)
  }
  if ((squadMin !== null && squadMax !== null && squadMax < squadMin) || (lineupMin !== null && lineupMax !== null && lineupMax < lineupMin)) {
    redirect(`${setupUrl}?error=invalid-rules`)
  }
  if ((matchDuration !== null && matchDuration < 1) || (periodCount !== null && periodCount < 1) || (squadMax !== null && squadMax < 1) || (lineupMax !== null && lineupMax < 1)) {
    redirect(`${setupUrl}?error=invalid-rules`)
  }

  const { error: tournamentError } = await supabase
    .from('tournaments')
    .update({
      name,
      description: description || null,
      season_label: seasonLabel || null,
      start_date: startDate || null,
      end_date: endDate || null,
      registration_opens_at: registrationOpensAt ? new Date(registrationOpensAt).toISOString() : null,
      registration_closes_at: registrationClosesAt ? new Date(registrationClosesAt).toISOString() : null,
      timezone,
      visibility,
      status,
    })
    .eq('id', tournamentId)
    .eq('organization_id', organizationId)

  if (tournamentError) {
    console.error('Tournament setup update failed:', tournamentError)
    redirect(`${setupUrl}?error=save-failed`)
  }

  const { error: settingsError } = await supabase
    .from('tournament_settings')
    .upsert({
      tournament_id: tournamentId,
      points_for_win: pointsForWin,
      points_for_draw: pointsForDraw,
      points_for_loss: pointsForLoss,
      allow_draws: formData.get('allow_draws') === 'on',
      extra_time_enabled: formData.get('extra_time_enabled') === 'on',
      penalties_enabled: formData.get('penalties_enabled') === 'on',
      match_duration_minutes: matchDuration,
      period_count: periodCount,
      squad_min: squadMin,
      squad_max: squadMax,
      lineup_min: lineupMin,
      lineup_max: lineupMax,
      substitutions_max: substitutionsMax,
    }, { onConflict: 'tournament_id' })

  if (settingsError) {
    console.error('Tournament settings update failed:', settingsError)
    redirect(`${setupUrl}?error=save-failed`)
  }

  revalidatePath(workspaceUrl)
  revalidatePath(setupUrl)
  redirect(`${setupUrl}?saved=1`)
}
