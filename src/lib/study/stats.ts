import type { Database } from '../../types/database'

type CardProgressRow = Database['public']['Tables']['card_progress']['Row']
type TestAttemptRow = Database['public']['Tables']['test_attempts']['Row']
type StudySessionRow = Database['public']['Tables']['study_sessions']['Row']

export interface ProgressSummary {
  totalCards: number
  studiedCards: number
  masteredCards: number
  learningCards: number
  notStartedCards: number
  reviewsDue: number
  answers: number
  correctAnswers: number
  accuracyPercent: number | null
  masteryPercent: number
  boxes: number[]
}

export interface TestSummary {
  attemptCount: number
  averageScore: number | null
  bestScore: number | null
}

export interface StudySessionSummary {
  sessionCount: number
  answers: number
  correctAnswers: number
  accuracyPercent: number | null
}

export function summarizeProgress(
  cardIds: string[],
  progressRows: CardProgressRow[],
  now = new Date(),
): ProgressSummary {
  const availableCardIds = new Set(cardIds)
  const rows = progressRows.filter((row) => availableCardIds.has(row.card_id))
  const studiedRows = rows.filter((row) => row.times_seen > 0)
  const masteredCards = studiedRows.filter((row) => row.box >= 4).length
  const answers = studiedRows.reduce((sum, row) => sum + row.times_seen, 0)
  const correctAnswers = studiedRows.reduce((sum, row) => sum + row.times_correct, 0)
  const boxes = Array.from({ length: 6 }, () => 0)

  for (const row of studiedRows) {
    const box = Math.max(0, Math.min(5, row.box))
    boxes[box] += 1
  }

  return {
    totalCards: cardIds.length,
    studiedCards: studiedRows.length,
    masteredCards,
    learningCards: studiedRows.length - masteredCards,
    notStartedCards: Math.max(0, cardIds.length - studiedRows.length),
    reviewsDue: studiedRows.filter((row) => new Date(row.due_at) <= now).length,
    answers,
    correctAnswers,
    accuracyPercent: answers === 0 ? null : Math.round((correctAnswers / answers) * 100),
    masteryPercent: cardIds.length === 0 ? 0 : Math.round((masteredCards / cardIds.length) * 100),
    boxes,
  }
}

export function summarizeTests(attempts: TestAttemptRow[]): TestSummary {
  if (attempts.length === 0) {
    return { attemptCount: 0, averageScore: null, bestScore: null }
  }

  const scores = attempts.map((attempt) => attempt.score)
  return {
    attemptCount: attempts.length,
    averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    bestScore: Math.max(...scores),
  }
}

export function summarizeStudySessions(sessions: StudySessionRow[]): StudySessionSummary {
  const recorded = sessions.filter((session) => session.cards_seen > 0)
  const answers = recorded.reduce((sum, session) => sum + session.cards_seen, 0)
  const correctAnswers = recorded.reduce((sum, session) => sum + session.cards_correct, 0)

  return {
    sessionCount: recorded.length,
    answers,
    correctAnswers,
    accuracyPercent: answers === 0 ? null : Math.round((correctAnswers / answers) * 100),
  }
}
