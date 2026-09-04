import { describe, expect, it } from 'vitest'
import { shouldClearUserCache } from './session'

describe('auth cache isolation', () => {
  it('does not clear during the initial session lookup', () => {
    expect(shouldClearUserCache(undefined, null)).toBe(false)
    expect(shouldClearUserCache(undefined, 'user-1')).toBe(false)
  })

  it('clears when a user signs in, signs out, or switches identity', () => {
    expect(shouldClearUserCache(null, 'user-1')).toBe(true)
    expect(shouldClearUserCache('user-1', null)).toBe(true)
    expect(shouldClearUserCache('user-1', 'user-2')).toBe(true)
  })

  it('keeps the cache for token refreshes on the same identity', () => {
    expect(shouldClearUserCache('user-1', 'user-1')).toBe(false)
    expect(shouldClearUserCache(null, null)).toBe(false)
  })
})
