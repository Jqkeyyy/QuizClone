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
  termSeparator: string = '\t',
  rowSeparator: string = '\n',
): ParsePasteResult {
  const rawRows = rowSeparator === '\n' ? text.split(/\r\n|\r|\n/) : text.split(rowSeparator)
  const rows: ParsedRow[] = []
  const termCounts = new Map<string, number>()

  for (const rawRow of rawRows) {
    const raw = rawRow.replace(/\r\n|\r|\n/g, ' ').trim()
    if (!raw) continue

    const parts = raw.split(termSeparator)
    const term = (parts[0] ?? '').trim()
    const definition = (parts[1] ?? '').trim()
    const valid = parts.length === 2 && term.length > 0 && definition.length > 0

    if (valid) {
      const key = term.toLocaleLowerCase()
      termCounts.set(key, (termCounts.get(key) ?? 0) + 1)
    }

    rows.push({ term, definition, raw, valid, duplicate: false })
  }

  for (const row of rows) {
    row.duplicate = row.valid && (termCounts.get(row.term.toLocaleLowerCase()) ?? 0) > 1
  }

  return {
    rows,
    validCount: rows.filter((row) => row.valid).length,
    invalidCount: rows.filter((row) => !row.valid).length,
  }
}
