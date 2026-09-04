import type { Database } from '../../types/database'
import { shuffle } from './shuffle'

type CardRow = Database['public']['Tables']['cards']['Row']

export interface MultipleChoiceQuestion {
  type: 'multiple-choice'
  cardId: string
  prompt: string
  promptImage: string | null
  options: string[]
  optionImages: Array<string | null>
  correctIndex: number
}

export interface TypedQuestion {
  type: 'typed'
  cardId: string
  prompt: string
  promptImage: string | null
  correctAnswer: string
  correctAnswerImage: string | null
}

export type Question = MultipleChoiceQuestion | TypedQuestion
export type TypedDirection = 'term-to-definition' | 'definition-to-term'

function pickDistractors(correct: CardRow, pool: CardRow[], count: number): CardRow[] {
  const seen = new Set([correct.definition])
  const candidates = pool
    .filter((card) => card.id !== correct.id && !seen.has(card.definition) && seen.add(card.definition))
    .sort(
      (a, b) =>
        Math.abs(a.definition.length - correct.definition.length) -
        Math.abs(b.definition.length - correct.definition.length),
    )
    .slice(0, Math.max(count * 2, count))

  return shuffle(candidates).slice(0, count)
}

export function makeMultipleChoice(
  card: CardRow,
  pool: CardRow[],
  optionCount: number,
): MultipleChoiceQuestion {
  const distractors = pickDistractors(card, pool, Math.max(optionCount - 1, 0))
  const entries = shuffle([
    { text: card.definition, image: card.definition_image, correct: true },
    ...distractors.map((candidate) => ({
      text: candidate.definition,
      image: candidate.definition_image,
      correct: false,
    })),
  ])

  return {
    type: 'multiple-choice',
    cardId: card.id,
    prompt: card.term,
    promptImage: card.term_image,
    options: entries.map((entry) => entry.text),
    optionImages: entries.map((entry) => entry.image),
    correctIndex: entries.findIndex((entry) => entry.correct),
  }
}

export function makeTypedQuestion(card: CardRow, direction: TypedDirection): TypedQuestion {
  return direction === 'term-to-definition'
    ? {
        type: 'typed', cardId: card.id, prompt: card.term, promptImage: card.term_image,
        correctAnswer: card.definition, correctAnswerImage: card.definition_image,
      }
    : {
        type: 'typed', cardId: card.id, prompt: card.definition, promptImage: card.definition_image,
        correctAnswer: card.term, correctAnswerImage: card.term_image,
      }
}

export function buildQuestion(card: CardRow, pool: CardRow[], box: number): Question {
  if (box <= 0) return makeMultipleChoice(card, pool, 4)
  if (box === 1) return makeMultipleChoice(card, pool, 6)
  if (box <= 3) return makeTypedQuestion(card, 'term-to-definition')
  return makeTypedQuestion(card, 'definition-to-term')
}
