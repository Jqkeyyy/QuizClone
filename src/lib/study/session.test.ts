import { describe, expect, it } from 'vitest'
import type { Database } from '../../types/database'
import { buildCramSession, buildLearnSession, NEW_PER_SESSION, requeue, SESSION_SIZE } from './session'

type CardRow = Database['public']['Tables']['cards']['Row']
type CardProgressRow = Database['public']['Tables']['card_progress']['Row']

function card(id: string): CardRow {
  return { id, set_id: 'set-1', term: `term-${id}`, definition: `definition-${id}`, term_image: null, definition_image: null, position: Number(id) || 0, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
}

function progress(cardId: string, overrides: Partial<CardProgressRow> = {}): CardProgressRow {
  return { user_id: 'user-1', card_id: cardId, set_id: 'set-1', box: 0, consecutive_correct: 0, lapses: 0, times_seen: 1, times_correct: 1, starred: false, due_at: '2026-01-01T00:00:00Z', last_seen_at: '2026-01-01T00:00:00Z', ...overrides }
}

const now = new Date('2026-06-01T12:00:00Z')

describe('Learn session queues', () => {
  it('includes fresh and due cards while excluding future cards', () => {
    const cards = [card('1'), card('2'), card('3')]
    const rows = new Map([
      ['2', progress('2', { due_at: '2026-05-01T00:00:00Z' })],
      ['3', progress('3', { due_at: '2026-12-01T00:00:00Z' })],
    ])
    expect(buildLearnSession(cards, rows, now).sort()).toEqual(['1', '2'])
  })

  it('caps fresh and total cards', () => {
    const fresh = Array.from({ length: NEW_PER_SESSION + 10 }, (_, index) => card(String(index)))
    expect(buildLearnSession(fresh, new Map(), now)).toHaveLength(NEW_PER_SESSION)

    const due = Array.from({ length: SESSION_SIZE + 10 }, (_, index) => card(String(index)))
    const rows = new Map(due.map((item) => [item.id, progress(item.id)]))
    expect(buildLearnSession(due, rows, now)).toHaveLength(SESSION_SIZE)
  })

  it('returns an empty queue when nothing is due', () => {
    const rows = new Map([['1', progress('1', { due_at: '2026-12-01T00:00:00Z' })]])
    expect(buildLearnSession([card('1')], rows, now)).toEqual([])
  })

  it('prioritizes weak or unseen cards in cram mode', () => {
    const cards = [card('weak'), card('strong'), card('unseen')]
    const rows = new Map([
      ['weak', progress('weak', { times_seen: 10, times_correct: 1, last_seen_at: '2026-05-01T00:00:00Z' })],
      ['strong', progress('strong', { times_seen: 10, times_correct: 10, last_seen_at: '2026-05-01T00:00:00Z' })],
    ])
    const result = buildCramSession(cards, rows, now)
    expect(result.indexOf('weak')).toBeLessThan(result.indexOf('strong'))
    expect(result.indexOf('unseen')).toBeLessThan(result.indexOf('strong'))
  })

  it('requeues a wrong card four to six positions later', () => {
    const queue = Array.from({ length: 20 }, (_, index) => String(index))
    const result = requeue(queue, 5)
    const repeatedAt = result.indexOf('5', 6)
    expect(repeatedAt).toBeGreaterThanOrEqual(9)
    expect(repeatedAt).toBeLessThanOrEqual(11)
    expect(result).toHaveLength(queue.length + 1)
  })

  it('clamps requeueing to the end of a short queue', () => {
    expect(requeue(['0', '1', '2'], 1)).toEqual(['0', '1', '2', '1'])
  })
})
