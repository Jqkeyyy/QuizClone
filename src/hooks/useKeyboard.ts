import { useEffect, useRef } from 'react'

type KeyHandler = (event: KeyboardEvent) => void

export interface ShortcutContext {
  defaultPrevented: boolean
  repeat: boolean
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  tagName?: string
  contentEditable: boolean
}

export function shouldHandleShortcut(context: ShortcutContext): boolean {
  if (context.defaultPrevented || context.repeat || context.altKey || context.ctrlKey || context.metaKey) return false
  if (context.contentEditable) return false
  return !['INPUT', 'TEXTAREA', 'SELECT'].includes(context.tagName ?? '')
}

export function useKeyboard(bindings: Record<string, KeyHandler>) {
  const bindingsRef = useRef(bindings)

  useEffect(() => {
    bindingsRef.current = bindings
  }, [bindings])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (!shouldHandleShortcut({
        defaultPrevented: event.defaultPrevented,
        repeat: event.repeat,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        tagName: target?.tagName,
        contentEditable: target?.isContentEditable ?? false,
      })) return

      const handler = bindingsRef.current[event.key]
      if (handler) {
        event.preventDefault()
        handler(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
