import type { Database } from '../../types/database'

type SetRow = Database['public']['Tables']['sets']['Row']

export type SetSort = 'recent' | 'title' | 'exam'

function compareNullableDates(left: string | null, right: string | null): number {
  if (left === right) return 0
  if (left === null) return 1
  if (right === null) return -1
  return left.localeCompare(right)
}

export function filterAndSortSets<T extends SetRow>(sets: T[], query: string, sort: SetSort): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filtered = normalizedQuery
    ? sets.filter((set) =>
        set.title.toLocaleLowerCase().includes(normalizedQuery)
        || set.description?.toLocaleLowerCase().includes(normalizedQuery),
      )
    : sets

  return [...filtered].sort((left, right) => {
    if (sort === 'title') return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })
    if (sort === 'exam') {
      return compareNullableDates(left.exam_date, right.exam_date)
        || right.updated_at.localeCompare(left.updated_at)
    }
    return right.updated_at.localeCompare(left.updated_at)
  })
}
