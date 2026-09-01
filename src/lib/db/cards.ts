import { supabase } from '../supabase'
import type { Database } from '../../types/database'

type CardRow = Database['public']['Tables']['cards']['Row']
type CardInsert = Database['public']['Tables']['cards']['Insert']

export type CardUpsertInput = {
  id?: string
  set_id: string
  term: string
  definition: string
  position?: number
}

export async function listCards(setId: string): Promise<CardRow[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', setId)
    .order('position', { ascending: true })
  if (error) throw error
  return data
}

export async function upsertCards(rows: CardUpsertInput[]): Promise<CardRow[]> {
  const { data, error } = await supabase.from('cards').upsert(rows).select()
  if (error) throw error
  return data
}

export async function bulkInsert(
  setId: string,
  pairs: Array<{ term: string; definition: string }>,
): Promise<CardRow[]> {
  const existing = await listCards(setId)
  const startPosition = existing.length === 0 ? 0 : Math.max(...existing.map((c) => c.position)) + 1

  const rows: CardInsert[] = pairs.map((pair, i) => ({
    set_id: setId,
    term: pair.term,
    definition: pair.definition,
    position: startPosition + i,
  }))

  const { data, error } = await supabase.from('cards').insert(rows).select()
  if (error) throw error
  return data
}

export async function reorder(order: Array<{ id: string; position: number }>): Promise<void> {
  const results = await Promise.all(
    order.map((o) => supabase.from('cards').update({ position: o.position }).eq('id', o.id)),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from('cards').delete().eq('id', id)
  if (error) throw error
}
