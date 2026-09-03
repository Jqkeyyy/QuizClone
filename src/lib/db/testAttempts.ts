import type { Database, Json } from '../../types/database'
import { supabase } from '../supabase'

type TestAttemptRow = Database['public']['Tables']['test_attempts']['Row']

export interface CreateTestAttemptInput {
  userId: string
  setId: string
  questionCount: number
  score: number
  config: Json
  answers: Json
}

export async function createTestAttempt(input: CreateTestAttemptInput): Promise<TestAttemptRow> {
  const { data, error } = await supabase
    .from('test_attempts')
    .insert({
      user_id: input.userId,
      set_id: input.setId,
      question_count: input.questionCount,
      score: input.score,
      config: input.config,
      answers: input.answers,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
