import { supabase } from '../supabase'
import type { Database } from '../../types/database'

type CardProgressRow = Database['public']['Tables']['card_progress']['Row']

export async function getStarredCardIds(userId: string, setId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('card_progress')
    .select('card_id')
    .eq('user_id', userId)
    .eq('set_id', setId)
    .eq('starred', true)
  if (error) throw error
  return data.map((row) => row.card_id)
}

export async function setStarred(
  userId: string,
  cardId: string,
  setId: string,
  starred: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('card_progress')
    .upsert({ user_id: userId, card_id: cardId, set_id: setId, starred })
  if (error) throw error
}

export async function getSetProgress(userId: string, setId: string): Promise<CardProgressRow[]> {
  const { data, error } = await supabase
    .from('card_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('set_id', setId)
  if (error) throw error
  return data
}

export type CardProgressFlushRow = Pick<
  Database['public']['Tables']['card_progress']['Insert'],
  | 'user_id'
  | 'card_id'
  | 'set_id'
  | 'box'
  | 'consecutive_correct'
  | 'lapses'
  | 'times_seen'
  | 'times_correct'
  | 'due_at'
  | 'last_seen_at'
>

export async function flushProgress(rows: CardProgressFlushRow[]): Promise<void> {
  if (rows.length === 0) return
  const { error } = await supabase.from('card_progress').upsert(rows)
  if (error) throw error
}
