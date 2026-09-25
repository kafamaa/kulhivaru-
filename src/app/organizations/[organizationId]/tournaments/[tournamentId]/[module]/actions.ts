'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const MODULES = ['registration','teams','players','groups-stages','fixtures','matches','live-control','standings','statistics','awards','officials','venues','news','sponsors','reports'] as const
const STATUSES = ['draft','active','pending','approved','scheduled','live','completed','cancelled','archived'] as const

function value(fd: FormData, key: string) { return String(fd.get(key) ?? '').trim() }
function safeModule(module: string) { return MODULES.includes(module as (typeof MODULES)[number]) }

async function authorize(organizationId: string, tournamentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: membership } = await supabase.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', user.id).eq('status', 'active').maybeSingle()
  if (!membership || !['owner','admin','manager'].includes(membership.role)) redirect(`/organizations/${organizationId}/tournaments/${tournamentId}`)
  const { data: tournament } = await supabase.from('tournaments').select('id').eq('id', tournamentId).eq('organization_id', organizationId).maybeSingle()
  if (!tournament) redirect(`/organizations/${organizationId}/tournaments`)
  return { supabase, user }
}

export async function createModuleRecordAction(formData: FormData) {
  const organizationId = value(formData,'organization_id'), tournamentId = value(formData,'tournament_id'), module = value(formData,'module')
  if (!organizationId || !tournamentId || !safeModule(module)) redirect('/dashboard')
  const base = `/organizations/${organizationId}/tournaments/${tournamentId}/${module}`
  const title = value(formData,'title'), subtitle = value(formData,'subtitle'), status = value(formData,'status') || 'active', scheduledAt = value(formData,'scheduled_at')
  const details = value(formData,'details'), reference = value(formData,'reference'), score = value(formData,'score'), notes = value(formData,'notes')
  if (!title || title.length > 180 || !STATUSES.includes(status as (typeof STATUSES)[number])) redirect(`${base}?error=invalid`)
  const { supabase, user } = await authorize(organizationId,tournamentId)
  const { error } = await supabase.from('tournament_module_records').insert({ tournament_id:tournamentId, module, title, subtitle:subtitle||null, status, scheduled_at:scheduledAt?new Date(scheduledAt).toISOString():null, data:{ details:details||null, reference:reference||null, score:score||null, notes:notes||null }, created_by:user.id })
  if (error) { console.error('Create module record failed', error); redirect(`${base}?error=save`) }
  revalidatePath(base); revalidatePath(`/organizations/${organizationId}/tournaments/${tournamentId}`); redirect(`${base}?saved=1`)
}

export async function updateModuleRecordAction(formData: FormData) {
  const organizationId=value(formData,'organization_id'), tournamentId=value(formData,'tournament_id'), module=value(formData,'module'), id=value(formData,'id')
  if (!organizationId || !tournamentId || !id || !safeModule(module)) redirect('/dashboard')
  const base=`/organizations/${organizationId}/tournaments/${tournamentId}/${module}`
  const title=value(formData,'title'), subtitle=value(formData,'subtitle'), status=value(formData,'status'), scheduledAt=value(formData,'scheduled_at')
  if (!title || title.length>180 || !STATUSES.includes(status as (typeof STATUSES)[number])) redirect(`${base}?error=invalid`)
  const { supabase }=await authorize(organizationId,tournamentId)
  const { error }=await supabase.from('tournament_module_records').update({title,subtitle:subtitle||null,status,scheduled_at:scheduledAt?new Date(scheduledAt).toISOString():null,updated_at:new Date().toISOString()}).eq('id',id).eq('tournament_id',tournamentId).eq('module',module)
  if(error){console.error('Update module record failed',error);redirect(`${base}?error=save`)}
  revalidatePath(base);redirect(`${base}?saved=1`)
}

export async function deleteModuleRecordAction(formData: FormData) {
  const organizationId=value(formData,'organization_id'), tournamentId=value(formData,'tournament_id'), module=value(formData,'module'), id=value(formData,'id')
  if(!organizationId||!tournamentId||!id||!safeModule(module))redirect('/dashboard')
  const base=`/organizations/${organizationId}/tournaments/${tournamentId}/${module}`
  const { supabase }=await authorize(organizationId,tournamentId)
  const { error }=await supabase.from('tournament_module_records').delete().eq('id',id).eq('tournament_id',tournamentId).eq('module',module)
  if(error){console.error('Delete module record failed',error);redirect(`${base}?error=save`)}
  revalidatePath(base);redirect(`${base}?deleted=1`)
}
