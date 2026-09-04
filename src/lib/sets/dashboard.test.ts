import { describe, expect, it } from 'vitest'
import type { Database } from '../../types/database'
import { filterAndSortSets } from './dashboard'

type SetRow = Database['public']['Tables']['sets']['Row']

function set(id: string, title: string, description: string | null, examDate: string | null, updatedAt: string): SetRow {
  return {
    id,
    owner_id: 'user-1',
    title,
    description,
    exam_date: examDate,
    visibility: 'private',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: updatedAt,
  }
}

const sets = [
  set('2', 'Zoology', 'Animal biology', null, '2026-09-02T00:00:00.000Z'),
  set('1', 'Anatomy', 'Human body', '2026-10-10', '2026-09-03T00:00:00.000Z'),
  set('3', 'Chemistry', null, '2026-09-20', '2026-09-01T00:00:00.000Z'),
]

describe('dashboard set filtering and sorting', () => {
  it('searches titles and descriptions without case sensitivity', () => {
    expect(filterAndSortSets(sets, 'BIOLOGY', 'recent').map(({ id }) => id)).toEqual(['2'])
    expect(filterAndSortSets(sets, 'atom', 'recent').map(({ id }) => id)).toEqual(['1'])
  })

  it('sorts by recent update, title, or upcoming exam', () => {
    expect(filterAndSortSets(sets, '', 'recent').map(({ id }) => id)).toEqual(['1', '2', '3'])
    expect(filterAndSortSets(sets, '', 'title').map(({ id }) => id)).toEqual(['1', '3', '2'])
    expect(filterAndSortSets(sets, '', 'exam').map(({ id }) => id)).toEqual(['3', '1', '2'])
  })

  it('does not mutate the query result array while sorting', () => {
    const original = sets.map(({ id }) => id)
    filterAndSortSets(sets, '', 'title')
    expect(sets.map(({ id }) => id)).toEqual(original)
  })
})
