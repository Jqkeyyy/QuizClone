import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Database, Json } from '../types/database'
import { createTestAttempt } from '../lib/db/testAttempts'
import { flushProgress } from '../lib/db/progress'
import { schedule, type CardProgressState } from '../lib/study/leitner'
import type { GradedTest, TestAnswers, TestConfig } from '../lib/study/test'

type CardProgressRow = Database['public']['Tables']['card_progress']['Row']

export interface SaveTestResultInput {
  userId: string
  setId: string
  examDate: string | null
  config: TestConfig
  answers: TestAnswers
  result: GradedTest
  progressByCardId: Map<string, CardProgressRow>
}

function emptyProgress(now: Date): CardProgressState {
  return {
    box: 0,
    consecutive_correct: 0,
    lapses: 0,
    times_seen: 0,
    times_correct: 0,
    due_at: now.toISOString(),
    last_seen_at: null,
  }
}

function parseExamDate(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00`) : null
}

export function useSaveTestResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SaveTestResultInput) => {
      const now = new Date()
      const examDate = parseExamDate(input.examDate)
      const rows = input.result.items.map((item) => {
        const existing = input.progressByCardId.get(item.cardId)
        const previous: CardProgressState = existing ?? emptyProgress(now)
        const next = schedule(previous, item.correct, examDate, now)
        return {
          user_id: input.userId,
          card_id: item.cardId,
          set_id: input.setId,
          starred: existing?.starred ?? false,
          ...next,
        }
      })

      await flushProgress(rows)
      return createTestAttempt({
        userId: input.userId,
        setId: input.setId,
        questionCount: input.result.totalCount,
        score: input.result.scorePercent,
        config: input.config as unknown as Json,
        answers: {
          submitted: input.answers as unknown as Json,
          graded: input.result.items as unknown as Json,
        },
      })
    },
    onSuccess: (_attempt, input) => {
      queryClient.invalidateQueries({ queryKey: ['progress', 'full', input.setId, input.userId] })
    },
  })
}
