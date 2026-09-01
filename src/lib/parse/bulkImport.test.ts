import { describe, expect, it } from 'vitest'
import { parsePaste } from './bulkImport'

describe('parsePaste', () => {
  it('splits on tab (term) and newline (row) by default', () => {
    const result = parsePaste('cat\tfeline\ndog\tcanine')
    expect(result.rows).toEqual([
      { term: 'cat', definition: 'feline', raw: 'cat\tfeline', valid: true, duplicate: false },
      { term: 'dog', definition: 'canine', raw: 'dog\tcanine', valid: true, duplicate: false },
    ])
    expect(result.validCount).toBe(2)
    expect(result.invalidCount).toBe(0)
  })

  it('supports a comma term separator and semicolon row separator', () => {
    const result = parsePaste('cat,feline;dog,canine', ',', ';')
    expect(result.rows.map((r) => [r.term, r.definition])).toEqual([
      ['cat', 'feline'],
      ['dog', 'canine'],
    ])
  })

  it('trims whitespace and drops blank rows', () => {
    const result = parsePaste('  cat \t feline  \n\n   \ndog\tcanine\n')
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({ term: 'cat', definition: 'feline' })
  })

  it('flags a row that does not split into exactly 2 parts', () => {
    const result = parsePaste('cat\tfeline\tfluffy\ndog\tcanine')
    expect(result.rows[0].valid).toBe(false)
    expect(result.rows[1].valid).toBe(true)
    expect(result.validCount).toBe(1)
    expect(result.invalidCount).toBe(1)
  })

  it('flags a row with no separator at all', () => {
    const result = parsePaste('catfeline\ndog\tcanine')
    expect(result.rows[0].valid).toBe(false)
  })

  it('marks duplicate terms (case-insensitive) but keeps both rows', () => {
    const result = parsePaste('cat\tfeline\nCat\tfelid\ndog\tcanine')
    expect(result.rows[0].duplicate).toBe(true)
    expect(result.rows[1].duplicate).toBe(true)
    expect(result.rows[2].duplicate).toBe(false)
    expect(result.validCount).toBe(3)
  })

  it('collapses internal newlines within a row into spaces', () => {
    const result = parsePaste('cat\tfe\nline;dog\tcanine', '\t', ';')
    expect(result.rows[0]).toMatchObject({ term: 'cat', definition: 'fe line' })
  })
})
