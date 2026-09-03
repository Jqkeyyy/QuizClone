import { describe, expect, it } from 'vitest'
import type { Database } from '../../types/database'
import { buildQuestion, makeMultipleChoice, makeTypedQuestion } from './questions'

type CardRow = Database['public']['Tables']['cards']['Row']

function card(id: string, term: string, definition: string): CardRow {
  return {
    id,
    set_id: 'set-1',
    term,
    definition,
    term_image: null,
    definition_image: null,
    position: Number(id),
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

const cards = [
  card('1', 'Amygdala', 'Processes fear and emotion'),
  card('2', 'Hippocampus', 'Forms new long-term memories'),
  card('3', 'Cerebellum', 'Coordinates balance and movement'),
  card('4', 'Thalamus', 'Relays sensory information'),
  card('5', 'Hypothalamus', 'Regulates hormones and temperature'),
  card('6', 'Medulla', 'Controls breathing and heart rate'),
]

describe('question builders', () => {
  it('builds a four-option multiple-choice question containing the answer', () => {
    const question = makeMultipleChoice(cards[0], cards, 4)
    expect(question.prompt).toBe(cards[0].term)
    expect(question.options).toHaveLength(4)
    expect(question.options[question.correctIndex]).toBe(cards[0].definition)
  })

  it('degrades gracefully for a small pool', () => {
    const question = makeMultipleChoice(cards[0], cards.slice(0, 2), 4)
    expect(question.options).toHaveLength(2)
    expect(question.options[question.correctIndex]).toBe(cards[0].definition)
  })

  it('never shows duplicate answer text', () => {
    const duplicate = card('7', 'Other term', cards[1].definition)
    const question = makeMultipleChoice(cards[0], [...cards.slice(0, 3), duplicate], 4)
    expect(new Set(question.options).size).toBe(question.options.length)
  })

  it('builds typed questions in either direction', () => {
    expect(makeTypedQuestion(cards[0], 'term-to-definition')).toMatchObject({
      prompt: cards[0].term,
      correctAnswer: cards[0].definition,
    })
    expect(makeTypedQuestion(cards[0], 'definition-to-term')).toMatchObject({
      prompt: cards[0].definition,
      correctAnswer: cards[0].term,
    })
  })

  it('escalates question types by box', () => {
    expect(buildQuestion(cards[0], cards, 0).type).toBe('multiple-choice')
    const boxOne = buildQuestion(cards[0], cards, 1)
    expect(boxOne.type).toBe('multiple-choice')
    if (boxOne.type === 'multiple-choice') expect(boxOne.options).toHaveLength(6)
    expect(buildQuestion(cards[0], cards, 2)).toMatchObject({ type: 'typed', prompt: cards[0].term })
    expect(buildQuestion(cards[0], cards, 4)).toMatchObject({ type: 'typed', prompt: cards[0].definition })
  })
})
