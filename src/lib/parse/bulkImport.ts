export interface ParsedRow {
  term: string
  definition: string
  valid: boolean
}

export interface ParseResult {
  rows: ParsedRow[]
  validCount: number
  invalidCount: number
  duplicateTerms: string[]
}

function splitRows(text: string, rowSep: string): string[] {
  if (rowSep === '\n') {
    return text.split(/\r\n|\r|\n/)
  }
  return text.split(rowSep)
}

function collapseWhitespace(field: string): string {
  return field.replace(/\r?\n/g, ' ').trim()
}

export function parsePaste(text: string, termSep: string, rowSep: string): ParseResult {
  const rawRows = splitRows(text, rowSep)
  const rows: ParsedRow[] = []
  const termCounts = new Map<string, number>()

  for (const rawRow of rawRows) {
    if (rawRow.trim() === '') continue

    const parts = rawRow.split(termSep)
    const valid = parts.length === 2 && parts[0].trim() !== '' && collapseWhitespace(parts[1]) !== ''

    if (!valid) {
      rows.push({ term: '', definition: '', valid: false })
      continue
    }

    const term = collapseWhitespace(parts[0])
    const definition = collapseWhitespace(parts[1])
    rows.push({ term, definition, valid: true })

    const key = term.toLowerCase()
    termCounts.set(key, (termCounts.get(key) ?? 0) + 1)
  }

  const validCount = rows.filter((r) => r.valid).length
  const invalidCount = rows.length - validCount
  const duplicateTerms = [...termCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([term]) => term)

  return { rows, validCount, invalidCount, duplicateTerms }
}
