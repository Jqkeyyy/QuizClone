import { supabase } from '../supabase'
import type { Database } from '../../types/database'

type Card = Database['public']['Tables']['cards']['Row']
type CardInsert = Database['public']['Tables']['cards']['Insert']

export async function listCards(setId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', setId)
    .order('position', { ascending: true })
  if (error) throw error
  return data
}

export async function upsertCard(card: CardInsert): Promise<Card> {
  const { data, error } = await supabase.from('cards').upsert(card).select().single()
  if (error) throw error
  return data
}

export async function bulkInsertCards(
  setId: string,
  rows: { term: string; definition: string }[],
): Promise<Card[]> {
  const { data: existing, error: maxErr } = await supabase
    .from('cards')
    .select('position')
    .eq('set_id', setId)
    .order('position', { ascending: false })
    .limit(1)
  if (maxErr) throw maxErr

  const startPosition = (existing[0]?.position ?? -1) + 1
  const inserts: CardInsert[] = rows.map((row, i) => ({
    set_id: setId,
    term: row.term,
    definition: row.definition,
    position: startPosition + i,
  }))

  const { data, error } = await supabase.from('cards').insert(inserts).select()
  if (error) throw error
  return data
}

export async function reorderCards(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, position) => supabase.from('cards').update({ position }).eq('id', id)),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from('cards').delete().eq('id', id)
  if (error) throw error
}
