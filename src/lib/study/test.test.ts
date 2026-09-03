import { describe, expect, it } from 'vitest'
import type { Database } from '../../types/database'
import { buildTest, gradeTest, type TestConfig } from './test'

type CardRow = Database['public']['Tables']['cards']['Row']
type CardProgressRow = Database['public']['Tables']['card_progress']['Row']

function card(index: number): CardRow {
  return {
    id: `card-${index}`,
    set_id: 'set-1',
    term: `Term ${index}`,
    definition: `Definition ${index}`,
    term_image: null,
    definition_image: null,
    position: index,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

function progress(cardId: string, box: number, correct: number, seen: number): CardProgressRow {
  return {
    user_id: 'user-1',
    card_id: cardId,
    set_id: 'set-1',
    box,
    consecutive_correct: 0,
    lapses: 0,
    times_seen: seen,
    times_correct: correct,
    starred: false,
    due_at: '2026-01-01T00:00:00Z',
    last_seen_at: null,
  }
}

const cards = Array.from({ length: 10 }, (_, index) => card(index + 1))
const baseConfig: TestConfig = {
  questionCount: 4,
  types: ['multiple-choice'],
  direction: 'term-to-definition',
  prioritizeWeak: false,
}

describe('test generation', () => {
  it('builds the requested number of multiple-choice cards with valid answers', () => {
    const questions = buildTest(cards, new Map(), baseConfig, () => 0.4)
    expect(questions).toHaveLength(4)
    for (const question of questions) {
      expect(question.type).toBe('multiple-choice')
      if (question.type === 'multiple-choice') {
        expect(question.options).toHaveLength(4)
        expect(question.correctIndex).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('supports reverse written questions', () => {
    const [question] = buildTest(
      cards,
      new Map(),
      { ...baseConfig, questionCount: 1, types: ['written'], direction: 'definition-to-term' },
      () => 0.4,
    )
    expect(question).toMatchObject({
      type: 'written',
      prompt: expect.stringContaining('Definition'),
      correctAnswer: expect.stringContaining('Term'),
    })
  })

  it('generates both true and false pairings', () => {
    const [truthy] = buildTest(
      cards,
      new Map(),
      { ...baseConfig, questionCount: 1, types: ['true-false'] },
      () => 0.1,
    )
    const [falsey] = buildTest(
      cards,
      new Map(),
      { ...baseConfig, questionCount: 1, types: ['true-false'] },
      () => 0.9,
    )
    expect(truthy).toMatchObject({ type: 'true-false', correctAnswer: true })
    expect(falsey).toMatchObject({ type: 'true-false', correctAnswer: false })
  })

  it('groups up to six cards into each matching question', () => {
    const questions = buildTest(
      cards,
      new Map(),
      { ...baseConfig, questionCount: 8, types: ['matching'] },
      () => 0.4,
    )
    expect(questions).toHaveLength(2)
    expect(questions[0].cardIds).toHaveLength(6)
    expect(questions[1].cardIds).toHaveLength(2)
  })

  it('prioritizes cards with lower boxes and lower accuracy', () => {
    const progressRows = [
      progress('card-1', 5, 10, 10),
      progress('card-2', 0, 8, 10),
      progress('card-3', 0, 2, 10),
    ]
    const questions = buildTest(
      cards.slice(0, 3),
      new Map(progressRows.map((row) => [row.card_id, row])),
      { ...baseConfig, questionCount: 1, types: ['written'], prioritizeWeak: true },
      () => 0.4,
    )
    expect(questions[0].cardIds).toEqual(['card-3'])
  })
})

describe('test grading', () => {
  it('grades multiple-choice and true-false answers without revealing feedback early', () => {
    const [choice] = buildTest(
      cards,
      new Map(),
      { ...baseConfig, questionCount: 1, types: ['multiple-choice'] },
      () => 0.4,
    )
    expect(choice.type).toBe('multiple-choice')
    if (choice.type !== 'multiple-choice') return
    expect(gradeTest([choice], { [choice.id]: choice.correctIndex })).toMatchObject({
      correctCount: 1,
      totalCount: 1,
      scorePercent: 100,
    })

    const [trueFalse] = buildTest(
      cards,
      new Map(),
      { ...baseConfig, questionCount: 1, types: ['true-false'] },
      () => 0.1,
    )
    expect(trueFalse.type).toBe('true-false')
    if (trueFalse.type !== 'true-false') return
    expect(gradeTest([trueFalse], { [trueFalse.id]: !trueFalse.correctAnswer })).toMatchObject({
      correctCount: 0,
      totalCount: 1,
      scorePercent: 0,
    })
  })

  it('grades matching answers separately for every card', () => {
    const questions = buildTest(
      cards.slice(0, 6),
      new Map(),
      { ...baseConfig, questionCount: 6, types: ['matching'] },
      () => 0.4,
    )
    const matching = questions[0]
    expect(matching.type).toBe('matching')
    if (matching.type !== 'matching') return

    const assignments = Object.fromEntries(
      matching.pairs.map((pair, index) => [
        pair.cardId,
        index === 0 ? matching.pairs[1].cardId : pair.cardId,
      ]),
    )
    const result = gradeTest(questions, { [matching.id]: assignments })
    expect(result.totalCount).toBe(6)
    expect(result.correctCount).toBe(5)
    expect(result.missedCardIds).toEqual([matching.pairs[0].cardId])
  })

  it('accepts a near written answer and treats unanswered questions as wrong', () => {
    const questions = buildTest(
      [
        { ...cards[0], term: 'Hippocampus', definition: 'Long-term memory' },
        { ...cards[1], term: 'Amygdala', definition: 'Fear processing' },
      ],
      new Map(),
      { ...baseConfig, questionCount: 2, types: ['written'] },
      () => 0.4,
    )
    const firstQuestion = questions[0]
    expect(firstQuestion.type).toBe('written')
    if (firstQuestion.type !== 'written') return
    const nearAnswer = firstQuestion.correctAnswer.slice(0, -1)
    const result = gradeTest(questions, { [firstQuestion.id]: nearAnswer })
    expect(result.items[0]).toMatchObject({ correct: true, near: true })
    expect(result.items[1]).toMatchObject({ correct: false, userAnswer: 'No answer' })
  })
})
