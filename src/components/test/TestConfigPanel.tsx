import { useState, type FormEvent } from 'react'
import type { TestConfig, TestDirection, TestQuestionType } from '../../lib/study/test'

const TYPE_OPTIONS: Array<{ value: TestQuestionType; label: string }> = [
  { value: 'multiple-choice', label: 'Multiple choice' },
  { value: 'written', label: 'Written' },
  { value: 'true-false', label: 'True / false' },
  { value: 'matching', label: 'Matching' },
]

export interface TestConfigPanelProps {
  cardCount: number
  onStart: (config: TestConfig) => void
}

export function TestConfigPanel({ cardCount, onStart }: TestConfigPanelProps) {
  const maximum = Math.min(cardCount, 100)
  const [questionCount, setQuestionCount] = useState(Math.min(20, maximum))
  const [types, setTypes] = useState<TestQuestionType[]>(['multiple-choice', 'written'])
  const [direction, setDirection] = useState<TestDirection>('mixed')
  const [prioritizeWeak, setPrioritizeWeak] = useState(true)

  function toggleType(type: TestQuestionType) {
    setTypes((current) =>
      current.includes(type) ? current.filter((candidate) => candidate !== type) : [...current, type],
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (types.length === 0 || questionCount < 1) return
    onStart({ questionCount, types, direction, prioritizeWeak })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Create a test</h1>
        <p className="mt-1 text-sm text-neutral-500">Answers are graded together after you finish.</p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-neutral-700">Cards to test</span>
        <input
          type="number"
          min={1}
          max={maximum}
          value={questionCount}
          onChange={(event) => setQuestionCount(Math.min(maximum, Math.max(1, Number(event.target.value))))}
          className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <span className="ml-2 text-sm text-neutral-400">of {cardCount}</span>
      </label>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-neutral-700">Question types</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {TYPE_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 rounded-md border border-neutral-200 p-3 text-sm">
              <input
                type="checkbox"
                checked={types.includes(option.value)}
                disabled={option.value === 'matching' && cardCount < 2}
                onChange={() => toggleType(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
        {types.length === 0 && <p className="mt-2 text-sm text-red-600">Choose at least one question type.</p>}
      </fieldset>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-neutral-700">Direction</span>
        <select
          value={direction}
          onChange={(event) => setDirection(event.target.value as TestDirection)}
          className="block rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="mixed">Mixed</option>
          <option value="term-to-definition">Term → definition</option>
          <option value="definition-to-term">Definition → term</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={prioritizeWeak}
          onChange={(event) => setPrioritizeWeak(event.target.checked)}
        />
        Prioritize cards I have struggled with
      </label>

      <button
        type="submit"
        disabled={types.length === 0}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Start test
      </button>
    </form>
  )
}
