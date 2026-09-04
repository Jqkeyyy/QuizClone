import type { Database } from '../../types/database'
import { gradeTyped } from './grading'

type CardRow = Database['public']['Tables']['cards']['Row']
type CardProgressRow = Database['public']['Tables']['card_progress']['Row']

export type TestQuestionType = 'multiple-choice' | 'written' | 'true-false' | 'matching'
export type TestDirection = 'term-to-definition' | 'definition-to-term' | 'mixed'

export interface TestConfig {
  questionCount: number
  types: TestQuestionType[]
  direction: TestDirection
  prioritizeWeak: boolean
}

interface BaseTestQuestion {
  id: string
  type: TestQuestionType
  cardIds: string[]
}

export interface ChoiceTestQuestion extends BaseTestQuestion {
  type: 'multiple-choice'
  prompt: string
  promptImage: string | null
  options: string[]
  optionImages: Array<string | null>
  correctIndex: number
}

export interface WrittenTestQuestion extends BaseTestQuestion {
  type: 'written'
  prompt: string
  promptImage: string | null
  correctAnswer: string
  correctAnswerImage: string | null
}

export interface TrueFalseTestQuestion extends BaseTestQuestion {
  type: 'true-false'
  term: string
  termImage: string | null
  definition: string
  definitionImage: string | null
  correctAnswer: boolean
}

export interface MatchingTestQuestion extends BaseTestQuestion {
  type: 'matching'
  pairs: Array<{ cardId: string; term: string; termImage: string | null; definition: string; definitionImage: string | null }>
  definitions: Array<{ cardId: string; text: string; image: string | null }>
}

export type TestQuestion =
  | ChoiceTestQuestion
  | WrittenTestQuestion
  | TrueFalseTestQuestion
  | MatchingTestQuestion

export type TestAnswer = number | string | boolean | Record<string, string> | null
export type TestAnswers = Record<string, TestAnswer>

export interface GradedTestItem {
  questionId: string
  cardId: string
  type: TestQuestionType
  prompt: string
  userAnswer: string
  correctAnswer: string
  correct: boolean
  near: boolean
  promptImage: string | null
  userAnswerImage: string | null
  correctAnswerImage: string | null
}

export interface GradedTest {
  items: GradedTestItem[]
  correctCount: number
  totalCount: number
  scorePercent: number
  missedCardIds: string[]
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const result = items.slice()
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

function answerFor(card: CardRow, direction: Exclude<TestDirection, 'mixed'>): string {
  return direction === 'term-to-definition' ? card.definition : card.term
}

function promptFor(card: CardRow, direction: Exclude<TestDirection, 'mixed'>): string {
  return direction === 'term-to-definition' ? card.term : card.definition
}

function promptImageFor(card: CardRow, direction: Exclude<TestDirection, 'mixed'>): string | null {
  return direction === 'term-to-definition' ? card.term_image : card.definition_image
}

function answerImageFor(card: CardRow, direction: Exclude<TestDirection, 'mixed'>): string | null {
  return direction === 'term-to-definition' ? card.definition_image : card.term_image
}

function resolveDirection(
  direction: TestDirection,
  random: () => number,
): Exclude<TestDirection, 'mixed'> {
  if (direction !== 'mixed') return direction
  return random() < 0.5 ? 'term-to-definition' : 'definition-to-term'
}

function selectCards(
  cards: CardRow[],
  progressByCardId: Map<string, CardProgressRow>,
  count: number,
  prioritizeWeak: boolean,
  random: () => number,
): CardRow[] {
  const randomized = shuffled(cards, random)
  if (!prioritizeWeak) return randomized.slice(0, count)

  return randomized
    .map((card) => {
      const progress = progressByCardId.get(card.id)
      const seen = progress?.times_seen ?? 0
      return {
        card,
        box: progress?.box ?? 0,
        accuracy: seen === 0 ? 0 : (progress?.times_correct ?? 0) / seen,
      }
    })
    .sort((left, right) => left.box - right.box || left.accuracy - right.accuracy)
    .slice(0, count)
    .map(({ card }) => card)
}

function makeChoiceQuestion(
  card: CardRow,
  pool: CardRow[],
  direction: Exclude<TestDirection, 'mixed'>,
  id: string,
  random: () => number,
): ChoiceTestQuestion {
  const correctAnswer = answerFor(card, direction)
  const seen = new Set([correctAnswer])
  const distractors = shuffled(pool, random)
    .filter((candidate) => candidate.id !== card.id)
    .map((candidate) => ({
      text: answerFor(candidate, direction),
      image: answerImageFor(candidate, direction),
    }))
    .filter(({ text }) => !seen.has(text) && seen.add(text))
    .slice(0, 3)
  const entries = shuffled(
    [{ text: correctAnswer, image: answerImageFor(card, direction), correct: true }, ...distractors.map((entry) => ({ ...entry, correct: false }))],
    random,
  )

  return {
    id,
    type: 'multiple-choice',
    cardIds: [card.id],
    prompt: promptFor(card, direction),
    promptImage: promptImageFor(card, direction),
    options: entries.map(({ text }) => text),
    optionImages: entries.map(({ image }) => image),
    correctIndex: entries.findIndex(({ correct }) => correct),
  }
}

function makeTrueFalseQuestion(
  card: CardRow,
  pool: CardRow[],
  id: string,
  random: () => number,
): TrueFalseTestQuestion {
  const alternatives = pool.filter(
    (candidate) => candidate.id !== card.id && candidate.definition !== card.definition,
  )
  const shouldBeTrue = alternatives.length === 0 || random() < 0.5
  const pairedCard = shouldBeTrue ? card : shuffled(alternatives, random)[0]

  return {
    id,
    type: 'true-false',
    cardIds: [card.id],
    term: card.term,
    termImage: card.term_image,
    definition: pairedCard.definition,
    definitionImage: pairedCard.definition_image,
    correctAnswer: shouldBeTrue,
  }
}

function makeMatchingQuestion(
  cards: CardRow[],
  id: string,
  random: () => number,
): MatchingTestQuestion {
  const pairs = cards.map((card) => ({
    cardId: card.id,
    term: card.term,
    termImage: card.term_image,
    definition: card.definition,
    definitionImage: card.definition_image,
  }))
  return {
    id,
    type: 'matching',
    cardIds: cards.map(({ id: cardId }) => cardId),
    pairs,
    definitions: shuffled(
      pairs.map(({ cardId, definition, definitionImage }) => ({ cardId, text: definition, image: definitionImage })),
      random,
    ),
  }
}

export function buildTest(
  cards: CardRow[],
  progressByCardId: Map<string, CardProgressRow>,
  config: TestConfig,
  random: () => number = Math.random,
): TestQuestion[] {
  if (cards.length === 0) return []
  const count = Math.min(Math.max(Math.trunc(config.questionCount), 1), cards.length)
  const selectedCards = selectCards(cards, progressByCardId, count, config.prioritizeWeak, random)
  const enabledTypes = config.types.length > 0 ? shuffled(config.types, random) : ['written' as const]
  const questions: TestQuestion[] = []
  let cardIndex = 0

  while (cardIndex < selectedCards.length) {
    const requestedType = enabledTypes[questions.length % enabledTypes.length]
    const id = `question-${questions.length + 1}`

    if (requestedType === 'matching' && selectedCards.length - cardIndex >= 2) {
      const group = selectedCards.slice(cardIndex, cardIndex + 6)
      questions.push(makeMatchingQuestion(group, id, random))
      cardIndex += group.length
      continue
    }

    const card = selectedCards[cardIndex++]
    const direction = resolveDirection(config.direction, random)
    if (requestedType === 'multiple-choice') {
      questions.push(makeChoiceQuestion(card, cards, direction, id, random))
    } else if (requestedType === 'true-false') {
      questions.push(makeTrueFalseQuestion(card, cards, id, random))
    } else {
      questions.push({
        id,
        type: 'written',
        cardIds: [card.id],
        prompt: promptFor(card, direction),
        promptImage: promptImageFor(card, direction),
        correctAnswer: answerFor(card, direction),
        correctAnswerImage: answerImageFor(card, direction),
      })
    }
  }

  return questions
}

function answerLabel(value: boolean): string {
  return value ? 'True' : 'False'
}

export function gradeTest(questions: TestQuestion[], answers: TestAnswers): GradedTest {
  const items: GradedTestItem[] = []

  for (const question of questions) {
    const answer = answers[question.id]
    if (question.type === 'multiple-choice') {
      const selectedIndex = typeof answer === 'number' ? answer : -1
      items.push({
        questionId: question.id,
        cardId: question.cardIds[0],
        type: question.type,
        prompt: question.prompt,
        userAnswer: question.options[selectedIndex] ?? 'No answer',
        correctAnswer: question.options[question.correctIndex],
        correct: selectedIndex === question.correctIndex,
        near: false,
        promptImage: question.promptImage,
        userAnswerImage: question.optionImages[selectedIndex] ?? null,
        correctAnswerImage: question.optionImages[question.correctIndex] ?? null,
      })
    } else if (question.type === 'written') {
      const userAnswer = typeof answer === 'string' ? answer : ''
      const grade = gradeTyped(userAnswer, question.correctAnswer)
      items.push({
        questionId: question.id,
        cardId: question.cardIds[0],
        type: question.type,
        prompt: question.prompt,
        userAnswer: userAnswer || 'No answer',
        correctAnswer: question.correctAnswer,
        promptImage: question.promptImage,
        userAnswerImage: null,
        correctAnswerImage: question.correctAnswerImage,
        ...grade,
      })
    } else if (question.type === 'true-false') {
      const userAnswer = typeof answer === 'boolean' ? answer : null
      items.push({
        questionId: question.id,
        cardId: question.cardIds[0],
        type: question.type,
        prompt: `${question.term} — ${question.definition}`,
        userAnswer: userAnswer === null ? 'No answer' : answerLabel(userAnswer),
        correctAnswer: answerLabel(question.correctAnswer),
        correct: userAnswer === question.correctAnswer,
        near: false,
        promptImage: question.termImage,
        userAnswerImage: null,
        correctAnswerImage: null,
      })
    } else {
      const assignments =
        answer && typeof answer === 'object' && !Array.isArray(answer)
          ? (answer as Record<string, string>)
          : {}
      for (const pair of question.pairs) {
        const selectedCardId = assignments[pair.cardId]
        const selectedDefinition = question.definitions.find(({ cardId }) => cardId === selectedCardId)
        items.push({
          questionId: question.id,
          cardId: pair.cardId,
          type: question.type,
          prompt: pair.term,
          userAnswer: selectedDefinition?.text ?? 'No answer',
          correctAnswer: pair.definition,
          correct: selectedCardId === pair.cardId,
          near: false,
          promptImage: pair.termImage,
          userAnswerImage: selectedDefinition?.image ?? null,
          correctAnswerImage: pair.definitionImage,
        })
      }
    }
  }

  const correctCount = items.filter(({ correct }) => correct).length
  const missedCardIds = [...new Set(items.filter(({ correct }) => !correct).map(({ cardId }) => cardId))]
  return {
    items,
    correctCount,
    totalCount: items.length,
    scorePercent: items.length === 0 ? 0 : Math.round((correctCount / items.length) * 100),
    missedCardIds,
  }
}
