import type { Database } from '../../types/database'
import { supabase } from '../supabase'

type SetRow = Database['public']['Tables']['sets']['Row']
type SetInsert = Database['public']['Tables']['sets']['Insert']
type SetUpdate = Database['public']['Tables']['sets']['Update']

export async function listMySets(userId: string): Promise<SetRow[]> {
  const { data, error } = await supabase
    .from('sets')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listSharedSets(userId: string): Promise<SetRow[]> {
  const { data, error } = await supabase
    .from('sets')
    .select('*, set_members!inner(user_id)')
    .eq('set_members.user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data as SetRow[]
}

export async function getSet(id: string): Promise<SetRow | null> {
  const { data, error } = await supabase.from('sets').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function createSet(
  input: Pick<SetInsert, 'owner_id' | 'title' | 'description' | 'exam_date'>,
): Promise<SetRow> {
  const { data, error } = await supabase.from('sets').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateSet(id: string, patch: SetUpdate): Promise<SetRow> {
  const { data, error } = await supabase.from('sets').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteSet(id: string): Promise<void> {
  const { error } = await supabase.from('sets').delete().eq('id', id)
  if (error) throw error
}
