import { describe, expect, it } from 'vitest'
import type { Database, Json } from '../../types/database'
import { summarizeProgress, summarizeStudySessions, summarizeTests } from './stats'

type CardProgressRow = Database['public']['Tables']['card_progress']['Row']
type TestAttemptRow = Database['public']['Tables']['test_attempts']['Row']
type StudySessionRow = Database['public']['Tables']['study_sessions']['Row']

function progress(cardId: string, overrides: Partial<CardProgressRow> = {}): CardProgressRow {
  return {
    user_id: 'user-1',
    card_id: cardId,
    set_id: 'set-1',
    box: 0,
    consecutive_correct: 0,
    lapses: 0,
    times_seen: 0,
    times_correct: 0,
    starred: false,
    due_at: '2026-09-01T00:00:00.000Z',
    last_seen_at: null,
    ...overrides,
  }
}

function attempt(id: string, score: number): TestAttemptRow {
  return {
    id,
    user_id: 'user-1',
    set_id: 'set-1',
    question_count: 10,
    score,
    config: {} as Json,
    answers: [] as Json,
    created_at: '2026-09-01T00:00:00.000Z',
  }
}

describe('study statistics', () => {
  it('summarizes mastery, due reviews, accuracy, and Leitner boxes', () => {
    const summary = summarizeProgress(
      ['new', 'learning', 'mastered', 'starred-only'],
      [
        progress('learning', { box: 2, times_seen: 4, times_correct: 3 }),
        progress('mastered', { box: 4, times_seen: 6, times_correct: 5, due_at: '2026-10-01T00:00:00.000Z' }),
        progress('starred-only', { starred: true }),
        progress('deleted', { times_seen: 20, times_correct: 20 }),
      ],
      new Date('2026-09-04T00:00:00.000Z'),
    )

    expect(summary).toEqual({
      totalCards: 4,
      studiedCards: 2,
      masteredCards: 1,
      learningCards: 1,
      notStartedCards: 2,
      reviewsDue: 1,
      answers: 10,
      correctAnswers: 8,
      accuracyPercent: 80,
      masteryPercent: 25,
      boxes: [0, 0, 1, 0, 1, 0],
    })
  })

  it('returns sensible empty progress values', () => {
    expect(summarizeProgress([], [])).toMatchObject({
      totalCards: 0,
      accuracyPercent: null,
      masteryPercent: 0,
      boxes: [0, 0, 0, 0, 0, 0],
    })
  })

  it('summarizes test scores', () => {
    expect(summarizeTests([attempt('1', 60), attempt('2', 85), attempt('3', 100)])).toEqual({
      attemptCount: 3,
      averageScore: 82,
      bestScore: 100,
    })
    expect(summarizeTests([])).toEqual({ attemptCount: 0, averageScore: null, bestScore: null })
  })

  it('summarizes recorded study sessions and ignores empty starts', () => {
    const sessions: StudySessionRow[] = [
      {
        id: 'session-1', user_id: 'user-1', set_id: 'set-1', mode: 'learn',
        started_at: '2026-09-01T00:00:00.000Z', ended_at: '2026-09-01T00:05:00.000Z',
        cards_seen: 8, cards_correct: 6,
      },
      {
        id: 'session-2', user_id: 'user-1', set_id: 'set-1', mode: 'cram',
        started_at: '2026-09-02T00:00:00.000Z', ended_at: '2026-09-02T00:05:00.000Z',
        cards_seen: 2, cards_correct: 1,
      },
      {
        id: 'empty', user_id: 'user-1', set_id: 'set-1', mode: 'learn',
        started_at: '2026-09-03T00:00:00.000Z', ended_at: null,
        cards_seen: 0, cards_correct: 0,
      },
    ]

    expect(summarizeStudySessions(sessions)).toEqual({
      sessionCount: 2,
      answers: 10,
      correctAnswers: 7,
      accuracyPercent: 70,
    })
    expect(summarizeStudySessions([])).toEqual({
      sessionCount: 0,
      answers: 0,
      correctAnswers: 0,
      accuracyPercent: null,
    })
  })
})
