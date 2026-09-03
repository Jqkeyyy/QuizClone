import { describe, expect, it } from 'vitest'
import { gradeTyped, levenshteinDistance, levenshteinRatio, normalize } from './grading'

describe('typed-answer grading', () => {
  it('normalizes case, punctuation, articles, and whitespace', () => {
    expect(normalize('  The Hippocampus!  ')).toBe('hippocampus')
    expect(normalize('an  operant   response')).toBe('operant response')
  })

  it('preserves letters and numbers from non-English alphabets', () => {
    expect(normalize('  L’ÉTÉ 2026! ')).toBe('lété 2026')
  })

  it('calculates Levenshtein distance and ratios', () => {
    expect(levenshteinDistance('cat', 'cats')).toBe(1)
    expect(levenshteinDistance('cat', 'bat')).toBe(1)
    expect(levenshteinDistance('', 'abc')).toBe(3)
    expect(levenshteinRatio('', '')).toBe(1)
    expect(levenshteinRatio('memory', 'memory')).toBe(1)
  })

  it('accepts exact and normalized matches', () => {
    expect(gradeTyped('hippocampus', 'hippocampus')).toEqual({ correct: true, near: false })
    expect(gradeTyped('The Hippocampus!', 'hippocampus')).toEqual({ correct: true, near: false })
  })

  it('accepts a close typo but labels it near', () => {
    expect(gradeTyped('hipocampus', 'hippocampus')).toEqual({ correct: true, near: true })
  })

  it('rejects empty and unrelated answers', () => {
    expect(gradeTyped('', '')).toEqual({ correct: true, near: false })
    expect(gradeTyped('', 'hippocampus')).toEqual({ correct: false, near: false })
    expect(gradeTyped('frontal lobe', 'hippocampus')).toEqual({ correct: false, near: false })
  })
})
