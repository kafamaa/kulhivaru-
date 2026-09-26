'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const v=(fd:FormData,k:string)=>String(fd.get(k)??'').trim()
const slugify=(s:string)=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)

async function authorize(organizationId:string,tournamentId:string){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect('/login')
 const {data:tournament}=await supabase.from('tournaments').select('id').eq('id',tournamentId).eq('organization_id',organizationId).maybeSingle()
 if(!tournament) redirect(`/organizations/${organizationId}/tournaments`)
 const {data:member}=await supabase.from('organization_members').select('role').eq('organization_id',organizationId).eq('user_id',user.id).eq('status','active').maybeSingle()
 if(!member||!['owner','admin','manager'].includes(member.role)) redirect(`/organizations/${organizationId}/tournaments/${tournamentId}`)
 return {supabase,user}
}

export async function createTournamentTeamAction(fd:FormData){
 const organizationId=v(fd,'organization_id'), tournamentId=v(fd,'tournament_id'), name=v(fd,'name'), shortName=v(fd,'short_name')
 const base=`/organizations/${organizationId}/tournaments/${tournamentId}/teams`; if(!name) redirect(`${base}?error=name`)
 const {supabase,user}=await authorize(organizationId,tournamentId)
 let slug=slugify(shortName||name)||`team-${Date.now()}`
 const {data:existing}=await supabase.from('teams').select('id').eq('organization_id',organizationId).eq('slug',slug).maybeSingle(); if(existing) slug=`${slug}-${Date.now().toString().slice(-6)}`
 const {data:team,error}=await supabase.from('teams').insert({organization_id:organizationId,name,short_name:shortName||null,slug,location:v(fd,'location')||null,manager_name:v(fd,'manager_name')||null,manager_phone:v(fd,'manager_phone')||null,manager_email:v(fd,'manager_email')||null,created_by:user.id}).select('id').single()
 if(error||!team){console.error(error);redirect(`${base}?error=save`)}
 const {error:entryError}=await supabase.from('tournament_teams').insert({tournament_id:tournamentId,team_id:team.id,seed_number:v(fd,'seed_number')?Number(v(fd,'seed_number')):null,created_by:user.id})
 if(entryError){console.error(entryError);redirect(`${base}?error=entry`)}
 await supabase.from('audit_logs').insert({organization_id:organizationId,actor_user_id:user.id,action:'tournament_team.created',entity_type:'team',entity_id:team.id,metadata:{name,tournament_id:tournamentId}})
 revalidatePath(base); redirect(`${base}?saved=1`)
}

export async function removeTournamentTeamAction(fd:FormData){
 const organizationId=v(fd,'organization_id'),tournamentId=v(fd,'tournament_id'),entryId=v(fd,'entry_id'); const base=`/organizations/${organizationId}/tournaments/${tournamentId}/teams`
 const {supabase,user}=await authorize(organizationId,tournamentId); const {error}=await supabase.from('tournament_teams').update({status:'withdrawn',updated_at:new Date().toISOString()}).eq('id',entryId).eq('tournament_id',tournamentId)
 if(error){console.error(error);redirect(`${base}?error=remove`)}
 await supabase.from('audit_logs').insert({organization_id:organizationId,actor_user_id:user.id,action:'tournament_team.withdrawn',entity_type:'tournament_team',entity_id:entryId,metadata:{tournament_id:tournamentId}})
 revalidatePath(base); redirect(`${base}?saved=1`)
}
