export interface ParsedRow {
  term: string
  definition: string
  raw: string
  valid: boolean
  duplicate: boolean
}

export interface ParsePasteResult {
  rows: ParsedRow[]
  validCount: number
  invalidCount: number
}

export function parsePaste(
  text: string,
  termSep: string = '\t',
  rowSep: string = '\n',
): ParsePasteResult {
  const rawRows = rowSep === '\n' ? text.split(/\r\n|\r|\n/) : text.split(rowSep)

  const rows: ParsedRow[] = []
  const termCounts = new Map<string, number>()

  for (const rawRow of rawRows) {
    const collapsed = rawRow.replace(/\r\n|\r|\n/g, ' ').trim()
    if (collapsed.length === 0) continue

    const parts = collapsed.split(termSep)
    const term = (parts[0] ?? '').trim()
    const definition = (parts[1] ?? '').trim()
    const valid = parts.length === 2 && term.length > 0 && definition.length > 0

    const key = term.toLowerCase()
    termCounts.set(key, (termCounts.get(key) ?? 0) + 1)

    rows.push({ term, definition, raw: collapsed, valid, duplicate: false })
  }

  for (const row of rows) {
    row.duplicate = (termCounts.get(row.term.toLowerCase()) ?? 0) > 1
  }

  return {
    rows,
    validCount: rows.filter((r) => r.valid).length,
    invalidCount: rows.filter((r) => !r.valid).length,
  }
}
