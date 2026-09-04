import type { Json } from '../../types/database'

export interface SavedGradedItem {
  questionId: string
  cardId: string
  prompt: string
  userAnswer: string
  correctAnswer: string
  correct: boolean
  near: boolean
  promptImage: string | null
  userAnswerImage: string | null
  correctAnswerImage: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalImage(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function readSavedTestItems(answers: Json): SavedGradedItem[] {
  if (!isRecord(answers) || !Array.isArray(answers.graded)) return []

  return answers.graded.flatMap((candidate) => {
    if (
      !isRecord(candidate)
      || typeof candidate.questionId !== 'string'
      || typeof candidate.cardId !== 'string'
      || typeof candidate.prompt !== 'string'
      || typeof candidate.userAnswer !== 'string'
      || typeof candidate.correctAnswer !== 'string'
      || typeof candidate.correct !== 'boolean'
    ) return []

    return [{
      questionId: candidate.questionId,
      cardId: candidate.cardId,
      prompt: candidate.prompt,
      userAnswer: candidate.userAnswer,
      correctAnswer: candidate.correctAnswer,
      correct: candidate.correct,
      near: candidate.near === true,
      promptImage: optionalImage(candidate.promptImage),
      userAnswerImage: optionalImage(candidate.userAnswerImage),
      correctAnswerImage: optionalImage(candidate.correctAnswerImage),
    }]
  })
}
