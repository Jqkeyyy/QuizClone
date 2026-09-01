import { supabase } from '../supabase'

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
