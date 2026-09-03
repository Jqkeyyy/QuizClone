import { useState, type FormEvent } from 'react'

export interface TypedAnswerProps {
  disabled: boolean
  onSubmit: (value: string) => void
}

export function TypedAnswer({ disabled, onSubmit }: TypedAnswerProps) {
  const [value, setValue] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!disabled && value.trim()) onSubmit(value)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        autoFocus
        disabled={disabled}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label="Your answer"
        autoComplete="off"
        className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none disabled:bg-neutral-50"
        placeholder="Type your answer…"
      />
      <button type="submit" disabled={disabled || !value.trim()} className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50">
        Submit
      </button>
    </form>
  )
}
