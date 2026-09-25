'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const VISIBILITIES = ['private', 'unlisted', 'public']
const STATUSES = ['draft', 'registration', 'scheduled', 'live', 'completed', 'cancelled', 'archived']
const TIE_BREAKERS = ['points', 'head_to_head', 'goal_difference', 'goals_for', 'wins', 'fair_play']

function text(formData: FormData, key: string) { return String(formData.get(key) ?? '').trim() }
function nullableInt(formData: FormData, key: string) { const v=text(formData,key); if(!v)return null; const n=Number(v); return Number.isInteger(n)?n:Number.NaN }
function numberValue(formData: FormData, key: string) { const v=text(formData,key); return v ? Number(v) : Number.NaN }
function checkbox(formData: FormData, key: string) { return formData.get(key) === 'on' }
function nullableText(formData: FormData, key: string) { const v=text(formData,key); return v || null }
function toIso(value:string){ if(!value)return null; const date=new Date(value); return Number.isNaN(date.getTime())?null:date.toISOString() }

export async function updateTournamentSetupAction(formData: FormData) {
  const supabase = await createClient()
  const organizationId=text(formData,'organization_id'), tournamentId=text(formData,'tournament_id')
  if(!organizationId||!tournamentId) redirect('/dashboard')
  const setupUrl=`/organizations/${organizationId}/tournaments/${tournamentId}/setup`, workspaceUrl=`/organizations/${organizationId}/tournaments/${tournamentId}`

  const {data:{user},error:userError}=await supabase.auth.getUser()
  if(userError||!user) redirect('/login')
  const {data:membership}=await supabase.from('organization_members').select('role,status').eq('organization_id',organizationId).eq('user_id',user.id).eq('status','active').maybeSingle()
  if(!membership||!['owner','admin','manager'].includes(membership.role)) redirect(workspaceUrl)
  const {data:tournament}=await supabase.from('tournaments').select('id').eq('id',tournamentId).eq('organization_id',organizationId).maybeSingle()
  if(!tournament) redirect(`/organizations/${organizationId}/tournaments`)

  const name=text(formData,'name'), description=text(formData,'description'), seasonLabel=text(formData,'season_label')
  const startDate=text(formData,'start_date'), endDate=text(formData,'end_date')
  const registrationOpensAt=text(formData,'registration_opens_at'), registrationClosesAt=text(formData,'registration_closes_at')
  const timezone=text(formData,'timezone')||'Indian/Maldives', visibility=text(formData,'visibility'), status=text(formData,'status')
  if(!name||name.length>160) redirect(`${setupUrl}?error=invalid-name`)
  if(startDate&&endDate&&endDate<startDate) redirect(`${setupUrl}?error=invalid-dates`)
  if(registrationOpensAt&&registrationClosesAt&&registrationClosesAt<registrationOpensAt) redirect(`${setupUrl}?error=invalid-registration-dates`)
  if(!VISIBILITIES.includes(visibility)) redirect(`${setupUrl}?error=invalid-visibility`)
  if(!STATUSES.includes(status)) redirect(`${setupUrl}?error=invalid-status`)

  const pointsForWin=numberValue(formData,'points_for_win'), pointsForDraw=numberValue(formData,'points_for_draw'), pointsForLoss=numberValue(formData,'points_for_loss')
  const matchDuration=nullableInt(formData,'match_duration_minutes'), periodCount=nullableInt(formData,'period_count'), squadMin=nullableInt(formData,'squad_min'), squadMax=nullableInt(formData,'squad_max'), lineupMin=nullableInt(formData,'lineup_min'), lineupMax=nullableInt(formData,'lineup_max'), substitutionsMax=nullableInt(formData,'substitutions_max')
  const nums=[pointsForWin,pointsForDraw,pointsForLoss], ints=[matchDuration,periodCount,squadMin,squadMax,lineupMin,lineupMax,substitutionsMax]
  if(nums.some(v=>!Number.isFinite(v)||v<0)||ints.some(v=>v!==null&&(!Number.isFinite(v)||v<0))) redirect(`${setupUrl}?error=invalid-rules`)
  if((squadMin!==null&&squadMax!==null&&squadMax<squadMin)||(lineupMin!==null&&lineupMax!==null&&lineupMax<lineupMin)) redirect(`${setupUrl}?error=invalid-rules`)
  if((matchDuration!==null&&matchDuration<1)||(periodCount!==null&&periodCount<1)||(squadMax!==null&&squadMax<1)||(lineupMax!==null&&lineupMax<1)) redirect(`${setupUrl}?error=invalid-rules`)

  const tieBreakers=formData.getAll('tie_breakers').map(String).filter(v=>TIE_BREAKERS.includes(v))
  if(tieBreakers.length===0) redirect(`${setupUrl}?error=invalid-tiebreakers`)

  const rules={
    competition_format: text(formData,'competition_format')||'league',
    team_registration_enabled: checkbox(formData,'team_registration_enabled'),
    player_registration_enabled: checkbox(formData,'player_registration_enabled'),
    require_registration_approval: checkbox(formData,'require_registration_approval'),
    allow_roster_changes: checkbox(formData,'allow_roster_changes'),
    roster_lock_at: nullableText(formData,'roster_lock_at'),
    yellow_card_suspension: nullableInt(formData,'yellow_card_suspension'),
    red_card_suspension: nullableInt(formData,'red_card_suspension'),
    notes: text(formData,'competition_notes'),
  }
  if((rules.yellow_card_suspension!==null&&(!Number.isFinite(rules.yellow_card_suspension)||rules.yellow_card_suspension<0))||(rules.red_card_suspension!==null&&(!Number.isFinite(rules.red_card_suspension)||rules.red_card_suspension<0))) redirect(`${setupUrl}?error=invalid-rules`)

  const {error:tournamentError}=await supabase.from('tournaments').update({name,description:description||null,season_label:seasonLabel||null,start_date:startDate||null,end_date:endDate||null,registration_opens_at:registrationOpensAt?toIso(registrationOpensAt):null,registration_closes_at:registrationClosesAt?toIso(registrationClosesAt):null,timezone,visibility,status}).eq('id',tournamentId).eq('organization_id',organizationId)
  if(tournamentError){console.error('Tournament setup update failed:',tournamentError);redirect(`${setupUrl}?error=save-failed`)}

  const {error:settingsError}=await supabase.from('tournament_settings').upsert({tournament_id:tournamentId,points_for_win:pointsForWin,points_for_draw:pointsForDraw,points_for_loss:pointsForLoss,allow_draws:checkbox(formData,'allow_draws'),extra_time_enabled:checkbox(formData,'extra_time_enabled'),penalties_enabled:checkbox(formData,'penalties_enabled'),match_duration_minutes:matchDuration,period_count:periodCount,squad_min:squadMin,squad_max:squadMax,lineup_min:lineupMin,lineup_max:lineupMax,substitutions_max:substitutionsMax,rules,tie_breakers:tieBreakers},{onConflict:'tournament_id'})
  if(settingsError){console.error('Tournament settings update failed:',settingsError);redirect(`${setupUrl}?error=save-failed`)}

  revalidatePath(workspaceUrl);revalidatePath(setupUrl);revalidatePath(`/organizations/${organizationId}/tournaments`)
  redirect(`${setupUrl}?saved=1`)
}
