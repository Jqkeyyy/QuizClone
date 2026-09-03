import { describe, expect, it } from 'vitest'
import type { Database } from '../../types/database'
import { backupFilename, buildSetBackup, parseSetBackup } from './setBackup'

type SetRow = Database['public']['Tables']['sets']['Row']
type CardRow = Database['public']['Tables']['cards']['Row']

const set: SetRow = {
  id: 'set-1',
  owner_id: 'user-1',
  title: 'Biology: Unit 1',
  description: 'Cell basics',
  exam_date: '2026-10-01',
  visibility: 'private',
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-02T00:00:00.000Z',
}

function card(id: string, position: number, term: string): CardRow {
  return {
    id,
    set_id: set.id,
    term,
    definition: `${term} definition`,
    term_image: null,
    definition_image: null,
    position,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  }
}

describe('set backups', () => {
  it('exports metadata and cards in study order without internal IDs', () => {
    const backup = JSON.parse(
      buildSetBackup(set, [card('card-2', 2, 'Second'), card('card-1', 1, 'First')], new Date('2026-09-03T12:00:00.000Z')),
    )

    expect(backup).toEqual({
      format: 'quizclone-set',
      version: 1,
      exported_at: '2026-09-03T12:00:00.000Z',
      set: {
        title: 'Biology: Unit 1',
        description: 'Cell basics',
        exam_date: '2026-10-01',
      },
      cards: [
        { term: 'First', definition: 'First definition', term_image: null, definition_image: null, position: 1 },
        { term: 'Second', definition: 'Second definition', term_image: null, definition_image: null, position: 2 },
      ],
    })
  })

  it('creates a Windows-safe filename with a useful fallback', () => {
    expect(backupFilename('  Biology:\n Unit 1?  ')).toBe('Biology- Unit 1-.quizclone.json')
    expect(backupFilename('...')).toBe('flashcard-set.quizclone.json')
  })

  it('parses a generated backup for restoration', () => {
    const backup = parseSetBackup(buildSetBackup(set, [card('card-1', 0, 'Cell')]))

    expect(backup.set.title).toBe('Biology: Unit 1')
    expect(backup.cards).toHaveLength(1)
    expect(backup.cards[0].term).toBe('Cell')
  })

  it('rejects unrelated or malformed JSON files', () => {
    expect(() => parseSetBackup('not json')).toThrow('not valid JSON')
    expect(() => parseSetBackup('{"format":"something-else"}')).toThrow('not a supported QuizClone backup')
    expect(() => parseSetBackup('{"format":"quizclone-set","version":1,"exported_at":"now","set":{"title":"Test","description":null,"exam_date":null},"cards":[{}]}')).toThrow('Card 1')
  })
})
