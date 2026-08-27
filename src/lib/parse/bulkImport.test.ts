import { describe, expect, test } from 'vitest'
import { parsePaste } from './bulkImport'

describe('parsePaste', () => {
  test('splits tab-separated, newline-separated rows', () => {
    const result = parsePaste('cat\tfeline\ndog\tcanine', '\t', '\n')
    expect(result.rows).toEqual([
      { term: 'cat', definition: 'feline', valid: true },
      { term: 'dog', definition: 'canine', valid: true },
    ])
    expect(result.validCount).toBe(2)
    expect(result.invalidCount).toBe(0)
  })

  test('supports comma and semicolon separators', () => {
    const result = parsePaste('cat,feline;dog,canine', ',', ';')
    expect(result.validCount).toBe(2)
    expect(result.rows[0]).toEqual({ term: 'cat', definition: 'feline', valid: true })
  })

  test('trims whitespace around fields', () => {
    const result = parsePaste('  cat \t  feline  ', '\t', '\n')
    expect(result.rows[0]).toEqual({ term: 'cat', definition: 'feline', valid: true })
  })

  test('drops blank rows', () => {
    const result = parsePaste('cat\tfeline\n\n\ndog\tcanine', '\t', '\n')
    expect(result.rows).toHaveLength(2)
  })

  test('handles \\r\\n line endings when rowSep is newline', () => {
    const result = parsePaste('cat\tfeline\r\ndog\tcanine', '\t', '\n')
    expect(result.rows).toHaveLength(2)
    expect(result.validCount).toBe(2)
  })

  test('flags rows that do not split into exactly 2 parts', () => {
    const result = parsePaste('cat\tfeline\ndog\ncat\tfeline\textra', '\t', '\n')
    expect(result.rows).toEqual([
      { term: 'cat', definition: 'feline', valid: true },
      { term: '', definition: '', valid: false },
      { term: '', definition: '', valid: false },
    ])
    expect(result.validCount).toBe(1)
    expect(result.invalidCount).toBe(2)
  })

  test('flags a row with an empty field as invalid', () => {
    const result = parsePaste('cat\t\ndog\tcanine', '\t', '\n')
    expect(result.rows[0].valid).toBe(false)
    expect(result.validCount).toBe(1)
  })

  test('collapses internal newlines within a field', () => {
    const result = parsePaste('cat\tfeline\nanimal;dog\tcanine', '\t', ';')
    expect(result.rows[0]).toEqual({ term: 'cat', definition: 'feline animal', valid: true })
  })

  test('reports duplicate terms case-insensitively but keeps both rows', () => {
    const result = parsePaste('cat\tfeline\nCat\tanother feline', '\t', '\n')
    expect(result.rows).toHaveLength(2)
    expect(result.validCount).toBe(2)
    expect(result.duplicateTerms).toEqual(['cat'])
  })

  test('supports a custom separator string', () => {
    const result = parsePaste('cat::feline||dog::canine', '::', '||')
    expect(result.validCount).toBe(2)
  })
})
