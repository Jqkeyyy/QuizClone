import { describe, expect, it } from 'vitest'
import { parsePaste } from './bulkImport'

describe('parsePaste', () => {
  it('splits tab-separated, newline-separated rows by default', () => {
    const result = parsePaste('cat\tfeline\ndog\tcanine')
    expect(result.rows).toEqual([
      { term: 'cat', definition: 'feline', raw: 'cat\tfeline', valid: true, duplicate: false },
      { term: 'dog', definition: 'canine', raw: 'dog\tcanine', valid: true, duplicate: false },
    ])
    expect(result.validCount).toBe(2)
    expect(result.invalidCount).toBe(0)
  })

  it('supports comma, semicolon, and custom separators', () => {
    expect(parsePaste('cat,feline;dog,canine', ',', ';').validCount).toBe(2)
    expect(parsePaste('cat::feline||dog::canine', '::', '||').validCount).toBe(2)
  })

  it('trims whitespace and drops blank rows', () => {
    const result = parsePaste('  cat \t feline  \r\n\r\n dog\tcanine')
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({ term: 'cat', definition: 'feline' })
  })

  it('flags rows that do not have exactly two non-empty fields', () => {
    const result = parsePaste('cat\tfeline\tdetail\ndog\nmouse\t', '\t', '\n')
    expect(result.validCount).toBe(0)
    expect(result.invalidCount).toBe(3)
    expect(result.rows.every((row) => !row.valid)).toBe(true)
  })

  it('marks duplicate terms case-insensitively while keeping both rows', () => {
    const result = parsePaste('cat\tfeline\nCat\tfelid\ndog\tcanine')
    expect(result.rows.map((row) => row.duplicate)).toEqual([true, true, false])
    expect(result.validCount).toBe(3)
  })

  it('collapses internal newlines when rows use another separator', () => {
    const result = parsePaste('cat\tfe\nline;dog\tcanine', '\t', ';')
    expect(result.rows[0]).toMatchObject({ term: 'cat', definition: 'fe line' })
  })
})
