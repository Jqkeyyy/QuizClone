import type { Database } from '../../types/database'
import { supabase } from '../supabase'

type CardRow = Database['public']['Tables']['cards']['Row']
type CardInsert = Database['public']['Tables']['cards']['Insert']
type CardUpdate = Database['public']['Tables']['cards']['Update']

export type CardTextUpdate = Pick<CardUpdate, 'term' | 'definition'>

export async function listCards(setId: string): Promise<CardRow[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', setId)
    .order('position', { ascending: true })
  if (error) throw error
  return data
}

export async function createCard(input: CardInsert): Promise<CardRow> {
  const { data, error } = await supabase.from('cards').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateCard(id: string, patch: CardTextUpdate): Promise<CardRow> {
  const { data, error } = await supabase.from('cards').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function bulkInsert(
  setId: string,
  pairs: Array<{ term: string; definition: string }>,
): Promise<CardRow[]> {
  const { data: lastCards, error: positionError } = await supabase
    .from('cards')
    .select('position')
    .eq('set_id', setId)
    .order('position', { ascending: false })
    .limit(1)
  if (positionError) throw positionError

  const startPosition = (lastCards[0]?.position ?? -1) + 1
  const rows: CardInsert[] = pairs.map((pair, index) => ({
    set_id: setId,
    term: pair.term,
    definition: pair.definition,
    position: startPosition + index,
  }))

  const { data, error } = await supabase.from('cards').insert(rows).select()
  if (error) throw error
  return data
}

export async function swapCardPositions(firstCardId: string, secondCardId: string): Promise<void> {
  const { error } = await supabase.rpc('swap_card_positions', {
    p_first: firstCardId,
    p_second: secondCardId,
  })
  if (error) throw error
}

export async function deleteCard(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id)
    .select('term_image, definition_image')
    .maybeSingle()
  if (error) throw error

  const imagePaths = [data?.term_image, data?.definition_image].filter((path): path is string => !!path)
  if (imagePaths.length > 0) {
    const { error: imageError } = await supabase.storage.from('card-images').remove(imagePaths)
    if (imageError) console.error('Could not remove deleted card images:', imageError)
  }
}
