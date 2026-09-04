import { describe, expect, it } from 'vitest'
import type { Json } from '../../types/database'
import { readSavedTestItems } from './history'

describe('saved test history', () => {
  it('reads graded answers with optional image metadata', () => {
    const answers = {
      graded: [{
        questionId: 'question-1',
        cardId: 'card-1',
        prompt: 'Cell',
        userAnswer: 'The basic unit of life',
        correctAnswer: 'The basic unit of life',
        correct: true,
        near: false,
        promptImage: 'set/card-term.png',
        userAnswerImage: null,
        correctAnswerImage: 'set/card-definition.png',
      }],
    } as Json

    expect(readSavedTestItems(answers)).toEqual([{
      questionId: 'question-1',
      cardId: 'card-1',
      prompt: 'Cell',
      userAnswer: 'The basic unit of life',
      correctAnswer: 'The basic unit of life',
      correct: true,
      near: false,
      promptImage: 'set/card-term.png',
      userAnswerImage: null,
      correctAnswerImage: 'set/card-definition.png',
    }])
  })

  it('supports older saved answers that have no image fields', () => {
    const answers = {
      graded: [{
        questionId: 'question-1', cardId: 'card-1', prompt: 'Term',
        userAnswer: 'Answer', correctAnswer: 'Answer', correct: true, near: true,
      }],
    } as Json

    expect(readSavedTestItems(answers)[0]).toMatchObject({
      near: true,
      promptImage: null,
      userAnswerImage: null,
      correctAnswerImage: null,
    })
  })

  it('ignores malformed records instead of failing the history screen', () => {
    expect(readSavedTestItems({ graded: ['bad', { prompt: 'missing fields' }] } as Json)).toEqual([])
    expect(readSavedTestItems([])).toEqual([])
  })
})
