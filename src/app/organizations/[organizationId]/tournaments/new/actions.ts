'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createTournamentAction(formData: FormData) {
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
  // FORM VALUES
  // ==========================================================

  const organizationId = String(
    formData.get('organization_id') ?? ''
  ).trim()

  const name = String(
    formData.get('name') ?? ''
  ).trim()

  const sportId = String(
    formData.get('sport_id') ?? ''
  ).trim()

  const description = String(
    formData.get('description') ?? ''
  ).trim()

  const seasonLabel = String(
    formData.get('season_label') ?? ''
  ).trim()

  const startDate = String(
    formData.get('start_date') ?? ''
  ).trim()

  const endDate = String(
    formData.get('end_date') ?? ''
  ).trim()

  const visibility = String(
    formData.get('visibility') ?? 'private'
  ).trim()

  // ==========================================================
  // ORGANIZATION ID
  // ==========================================================

  if (!organizationId) {
    redirect('/dashboard')
  }

  const newTournamentUrl =
    `/organizations/${organizationId}/tournaments/new`

  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (!name || name.length > 160) {
    redirect(
      `${newTournamentUrl}?error=invalid-name`
    )
  }

  if (!sportId) {
    redirect(
      `${newTournamentUrl}?error=missing-sport`
    )
  }

  if (
    !['private', 'unlisted', 'public'].includes(visibility)
  ) {
    redirect(
      `${newTournamentUrl}?error=invalid-visibility`
    )
  }

  if (
    startDate &&
    endDate &&
    endDate < startDate
  ) {
    redirect(
      `${newTournamentUrl}?error=invalid-dates`
    )
  }

  // ==========================================================
  // VERIFY ORGANIZATION
  // ==========================================================

  const {
    data: organization,
    error: organizationError,
  } = await supabase
    .from('organizations')
    .select(`
      id,
      status
    `)
    .eq('id', organizationId)
    .maybeSingle()

  if (
    organizationError ||
    !organization ||
    organization.status !== 'active'
  ) {
    redirect('/dashboard')
  }

  // ==========================================================
  // VERIFY ORGANIZATION MEMBERSHIP
  // ==========================================================

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from('organization_members')
    .select(`
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
    !['owner', 'admin', 'manager'].includes(
      membership.role
    )
  ) {
    redirect(
      `/organizations/${organizationId}`
    )
  }

  // ==========================================================
  // VERIFY SPORT
  // ==========================================================

  const {
    data: sport,
    error: sportError,
  } = await supabase
    .from('sports')
    .select(`
      id,
      name,
      slug,
      status
    `)
    .eq('id', sportId)
    .eq('status', 'active')
    .maybeSingle()

  if (sportError || !sport) {
    redirect(
      `${newTournamentUrl}?error=invalid-sport`
    )
  }

  // ==========================================================
  // GENERATE UNIQUE TOURNAMENT SLUG
  // ==========================================================

  const baseSlug =
    makeSlug(name) ||
    `tournament-${Date.now()}`

  let slug = baseSlug

  let suffix = 2

  while (true) {
    const {
      data: existingTournament,
      error: existingTournamentError,
    } = await supabase
      .from('tournaments')
      .select('id')
      .eq(
        'organization_id',
        organizationId
      )
      .eq('slug', slug)
      .maybeSingle()

    if (existingTournamentError) {
      console.error(
        'Tournament slug check failed:',
        existingTournamentError
      )

      redirect(
        `${newTournamentUrl}?error=create-failed`
      )
    }

    if (!existingTournament) {
      break
    }

    slug = `${baseSlug}-${suffix}`

    suffix += 1

    if (suffix > 100) {
      slug =
        `${baseSlug}-${Date.now()}`

      break
    }
  }

  // ==========================================================
  // CREATE TOURNAMENT
  // ==========================================================

  const {
    data: tournament,
    error: tournamentError,
  } = await supabase
    .from('tournaments')
    .insert({
      organization_id: organizationId,

      sport_id: sportId,

      name,

      slug,

      description:
        description.length > 0
          ? description
          : null,

      season_label:
        seasonLabel.length > 0
          ? seasonLabel
          : null,

      start_date:
        startDate.length > 0
          ? startDate
          : null,

      end_date:
        endDate.length > 0
          ? endDate
          : null,

      timezone: 'Indian/Maldives',

      visibility,

      status: 'draft',

      created_by: user.id,
    })
    .select(`
      id,
      name,
      slug
    `)
    .single()

  if (
    tournamentError ||
    !tournament
  ) {
    console.error(
      'Tournament creation failed:',
      tournamentError
    )

    redirect(
      `${newTournamentUrl}?error=create-failed`
    )
  }

  // ==========================================================
  // CREATE DEFAULT TOURNAMENT SETTINGS
  // ==========================================================
  //
  // Database defaults automatically provide:
  //
  // points_for_win  = 3
  // points_for_draw = 1
  // points_for_loss = 0
  // allow_draws     = true
  // rules           = {}
  // tie_breakers    = defaults from migration
  //
  // ==========================================================

  const {
    error: settingsError,
  } = await supabase
    .from('tournament_settings')
    .insert({
      tournament_id: tournament.id,
    })

  if (settingsError) {
    console.error(
      'Tournament settings creation failed:',
      settingsError
    )

    // Remove incomplete tournament.
    //
    // tournament_settings is cascade-linked,
    // so deleting tournament cleans related rows.

    const {
      error: cleanupError,
    } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournament.id)

    if (cleanupError) {
      console.error(
        'Tournament cleanup failed:',
        cleanupError
      )
    }

    redirect(
      `${newTournamentUrl}?error=settings-failed`
    )
  }

  // ==========================================================
  // ADD CREATOR AS TOURNAMENT ADMIN
  // ==========================================================

  const {
    error: memberError,
  } = await supabase
    .from('tournament_members')
    .insert({
      tournament_id:
        tournament.id,

      user_id:
        user.id,

      role:
        'admin',

      status:
        'active',

      assigned_by:
        user.id,
    })

  if (memberError) {
    console.error(
      'Tournament membership creation failed:',
      memberError
    )

    // Tournament deletion cascades to
    // tournament_settings and tournament_members.

    const {
      error: cleanupError,
    } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournament.id)

    if (cleanupError) {
      console.error(
        'Tournament cleanup failed:',
        cleanupError
      )
    }

    redirect(
      `${newTournamentUrl}?error=membership-failed`
    )
  }

  // ==========================================================
  // SUCCESS
  // ==========================================================

  redirect(
    `/organizations/${organizationId}/tournaments/${tournament.id}`
  )
}