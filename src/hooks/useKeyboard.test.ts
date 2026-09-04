import { describe, expect, it } from 'vitest'
import { shouldHandleShortcut, type ShortcutContext } from './useKeyboard'

const base: ShortcutContext = {
  defaultPrevented: false,
  repeat: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  contentEditable: false,
}

describe('keyboard shortcuts', () => {
  it('handles an unmodified key outside an editor', () => {
    expect(shouldHandleShortcut(base)).toBe(true)
    expect(shouldHandleShortcut({ ...base, tagName: 'BUTTON' })).toBe(true)
  })

  it('does not intercept typing or browser shortcuts', () => {
    expect(shouldHandleShortcut({ ...base, tagName: 'INPUT' })).toBe(false)
    expect(shouldHandleShortcut({ ...base, tagName: 'TEXTAREA' })).toBe(false)
    expect(shouldHandleShortcut({ ...base, contentEditable: true })).toBe(false)
    expect(shouldHandleShortcut({ ...base, ctrlKey: true })).toBe(false)
    expect(shouldHandleShortcut({ ...base, metaKey: true })).toBe(false)
  })

  it('ignores repeated and already-handled events', () => {
    expect(shouldHandleShortcut({ ...base, repeat: true })).toBe(false)
    expect(shouldHandleShortcut({ ...base, defaultPrevented: true })).toBe(false)
  })
})
