import type { Database } from '../../types/database'
import { supabase } from '../supabase'

type StudySessionRow = Database['public']['Tables']['study_sessions']['Row']
type StudyMode = StudySessionRow['mode']

export async function listStudySessions(userId: string, setId: string): Promise<StudySessionRow[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('set_id', setId)
    .order('started_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createStudySession(
  userId: string,
  setId: string,
  mode: StudyMode,
): Promise<StudySessionRow> {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({ user_id: userId, set_id: setId, mode })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function finishStudySession(
  sessionId: string,
  cardsSeen: number,
  cardsCorrect: number,
): Promise<void> {
  const { error } = await supabase
    .from('study_sessions')
    .update({
      ended_at: new Date().toISOString(),
      cards_seen: cardsSeen,
      cards_correct: cardsCorrect,
    })
    .eq('id', sessionId)
  if (error) throw error
}
