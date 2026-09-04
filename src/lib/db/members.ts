import type { Database } from '../../types/database'
import { supabase } from '../supabase'

type MemberRow = Database['public']['Tables']['set_members']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

export interface SetMember extends MemberRow {
  profile: Pick<ProfileRow, 'email' | 'display_name'> | null
}

export async function listSetMembers(setId: string): Promise<SetMember[]> {
  const { data: members, error: membersError } = await supabase
    .from('set_members')
    .select('*')
    .eq('set_id', setId)
    .order('created_at', { ascending: true })
  if (membersError) throw membersError
  if (members.length === 0) return []

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .in('id', members.map((member) => member.user_id))
  if (profilesError) throw profilesError

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
  return members.map((member) => ({
    ...member,
    profile: profilesById.get(member.user_id) ?? null,
  }))
}

export async function getSetMembership(setId: string, userId: string): Promise<MemberRow | null> {
  const { data, error } = await supabase
    .from('set_members')
    .select('*')
    .eq('set_id', setId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function addMemberByEmail(
  setId: string,
  email: string,
  role: MemberRow['role'],
): Promise<MemberRow> {
  const { data, error } = await supabase.rpc('add_member_by_email', {
    p_set: setId,
    p_email: email,
    p_role: role,
  })
  if (error) throw error
  return data
}

export async function updateMemberRole(
  setId: string,
  userId: string,
  role: MemberRow['role'],
): Promise<MemberRow> {
  const { data, error } = await supabase
    .from('set_members')
    .update({ role })
    .eq('set_id', setId)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeMember(setId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('set_members')
    .delete()
    .eq('set_id', setId)
    .eq('user_id', userId)
  if (error) throw error
}
