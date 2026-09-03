import type { Database } from '../../types/database'
import { shuffle } from './shuffle'

type CardRow = Database['public']['Tables']['cards']['Row']

export interface MultipleChoiceQuestion {
  type: 'multiple-choice'
  cardId: string
  prompt: string
  options: string[]
  correctIndex: number
}

export interface TypedQuestion {
  type: 'typed'
  cardId: string
  prompt: string
  correctAnswer: string
}

export type Question = MultipleChoiceQuestion | TypedQuestion
export type TypedDirection = 'term-to-definition' | 'definition-to-term'

function pickDistractors(correct: CardRow, pool: CardRow[], count: number): string[] {
  const seen = new Set([correct.definition])
  const candidates = pool
    .filter((card) => card.id !== correct.id && !seen.has(card.definition) && seen.add(card.definition))
    .sort(
      (a, b) =>
        Math.abs(a.definition.length - correct.definition.length) -
        Math.abs(b.definition.length - correct.definition.length),
    )
    .slice(0, Math.max(count * 2, count))

  return shuffle(candidates).slice(0, count).map((card) => card.definition)
}

export function makeMultipleChoice(
  card: CardRow,
  pool: CardRow[],
  optionCount: number,
): MultipleChoiceQuestion {
  const distractors = pickDistractors(card, pool, Math.max(optionCount - 1, 0))
  const entries = shuffle([
    { text: card.definition, correct: true },
    ...distractors.map((text) => ({ text, correct: false })),
  ])

  return {
    type: 'multiple-choice',
    cardId: card.id,
    prompt: card.term,
    options: entries.map((entry) => entry.text),
    correctIndex: entries.findIndex((entry) => entry.correct),
  }
}

export function makeTypedQuestion(card: CardRow, direction: TypedDirection): TypedQuestion {
  return direction === 'term-to-definition'
    ? { type: 'typed', cardId: card.id, prompt: card.term, correctAnswer: card.definition }
    : { type: 'typed', cardId: card.id, prompt: card.definition, correctAnswer: card.term }
}

export function buildQuestion(card: CardRow, pool: CardRow[], box: number): Question {
  if (box <= 0) return makeMultipleChoice(card, pool, 4)
  if (box === 1) return makeMultipleChoice(card, pool, 6)
  if (box <= 3) return makeTypedQuestion(card, 'term-to-definition')
  return makeTypedQuestion(card, 'definition-to-term')
}
