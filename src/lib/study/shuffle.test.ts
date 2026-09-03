import { describe, expect, it } from 'vitest'
import { shuffle } from './shuffle'

describe('shuffle', () => {
  it('does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5]
    const copy = [...input]
    shuffle(input)
    expect(input).toEqual(copy)
  })

  it('returns an array of the same length', () => {
    const input = [1, 2, 3, 4, 5]
    expect(shuffle(input)).toHaveLength(5)
  })

  it('returns the same elements as a multiset', () => {
    const input = ['a', 'b', 'c', 'd']
    const result = shuffle(input)
    expect([...result].sort()).toEqual([...input].sort())
  })

  it('handles an empty array', () => {
    expect(shuffle([])).toEqual([])
  })

  it('handles a single-element array', () => {
    expect(shuffle([42])).toEqual([42])
  })

  it('produces more than one distinct order across many runs', () => {
    const input = Array.from({ length: 20 }, (_, i) => i)
    const outputs = new Set<string>()
    for (let i = 0; i < 20; i++) {
      outputs.add(shuffle(input).join(','))
    }
    // 20 elements have 20! possible orders; seeing only one order across
    // 20 runs would mean shuffle is a no-op, not bad luck.
    expect(outputs.size).toBeGreaterThan(1)
  })
})
