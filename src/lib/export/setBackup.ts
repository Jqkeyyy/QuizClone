import type { Database } from '../../types/database'

type SetRow = Database['public']['Tables']['sets']['Row']
type CardRow = Database['public']['Tables']['cards']['Row']

export interface SetBackup {
  format: 'quizclone-set'
  version: 1
  exported_at: string
  set: Pick<SetRow, 'title' | 'description' | 'exam_date'>
  cards: Array<Pick<CardRow, 'term' | 'definition' | 'term_image' | 'definition_image' | 'position'>>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

export function parseSetBackup(contents: string): SetBackup {
  let value: unknown
  try {
    value = JSON.parse(contents)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  if (!isRecord(value) || value.format !== 'quizclone-set' || value.version !== 1) {
    throw new Error('This is not a supported QuizClone backup.')
  }
  if (typeof value.exported_at !== 'string' || !isRecord(value.set) || !Array.isArray(value.cards)) {
    throw new Error('The backup is missing required set data.')
  }

  const title = value.set.title
  const description = value.set.description
  const examDate = value.set.exam_date
  if (typeof title !== 'string' || !title.trim() || !isNullableString(description) || !isNullableString(examDate)) {
    throw new Error('The backup contains invalid set details.')
  }
  if (examDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
    throw new Error('The backup contains an invalid exam date.')
  }

  const cards = value.cards.map((candidate, index) => {
    if (
      !isRecord(candidate)
      || typeof candidate.term !== 'string'
      || typeof candidate.definition !== 'string'
      || !isNullableString(candidate.term_image)
      || !isNullableString(candidate.definition_image)
      || typeof candidate.position !== 'number'
      || !Number.isInteger(candidate.position)
    ) {
      throw new Error(`Card ${index + 1} in the backup is invalid.`)
    }

    return {
      term: candidate.term,
      definition: candidate.definition,
      term_image: candidate.term_image,
      definition_image: candidate.definition_image,
      position: candidate.position,
    }
  })

  return {
    format: 'quizclone-set',
    version: 1,
    exported_at: value.exported_at,
    set: { title: title.trim(), description, exam_date: examDate },
    cards,
  }
}

export function buildSetBackup(set: SetRow, cards: CardRow[], exportedAt = new Date()): string {
  const backup: SetBackup = {
    format: 'quizclone-set',
    version: 1,
    exported_at: exportedAt.toISOString(),
    set: {
      title: set.title,
      description: set.description,
      exam_date: set.exam_date,
    },
    cards: [...cards]
      .sort((left, right) => left.position - right.position)
      .map(({ term, definition, term_image, definition_image, position }) => ({
        term,
        definition,
        term_image,
        definition_image,
        position,
      })),
  }

  return JSON.stringify(backup, null, 2)
}

export function backupFilename(title: string): string {
  const printableTitle = Array.from(title.trim())
    .filter((character) => character.charCodeAt(0) >= 32)
    .join('')
  const safeTitle = printableTitle
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .slice(0, 80)

  return `${safeTitle || 'flashcard-set'}.quizclone.json`
}

export function downloadSetBackup(set: SetRow, cards: CardRow[]): void {
  const blob = new Blob([buildSetBackup(set, cards)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = backupFilename(set.title)
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
