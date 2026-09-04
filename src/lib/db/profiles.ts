import type { Database } from '../../types/database'
import { supabase } from '../supabase'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export async function getProfile(userId: string): Promise<ProfileRow> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

export async function updateDisplayName(userId: string, displayName: string | null): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}
