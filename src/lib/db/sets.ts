import { supabase } from '../supabase'
import type { Database } from '../../types/database'

type Set = Database['public']['Tables']['sets']['Row']
type SetUpdate = Database['public']['Tables']['sets']['Update']

export async function listSets(): Promise<Set[]> {
  const { data, error } = await supabase.from('sets').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getSet(id: string): Promise<Set> {
  const { data, error } = await supabase.from('sets').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createSet(input: {
  owner_id: string
  title: string
  description?: string | null
  exam_date?: string | null
}): Promise<Set> {
  // @ts-expect-error - TS2345: Type inference issue with .insert()
  const { data, error } = await supabase.from('sets').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateSet(id: string, patch: SetUpdate): Promise<Set> {
  // @ts-expect-error - TS2345: Type inference issue with .update()
  const { data, error } = await supabase.from('sets').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteSet(id: string): Promise<void> {
  const { error } = await supabase.from('sets').delete().eq('id', id)
  if (error) throw error
}
