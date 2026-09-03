import { useState } from 'react'
import type { MatchingTestQuestion, TestAnswer, TestQuestion } from '../../lib/study/test'

export interface TestQuestionCardProps {
  question: TestQuestion
  answer: TestAnswer | undefined
  onAnswer: (answer: TestAnswer) => void
}

function MatchingQuestion({
  question,
  answer,
  onAnswer,
}: {
  question: MatchingTestQuestion
  answer: TestAnswer | undefined
  onAnswer: (answer: TestAnswer) => void
}) {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const assignments =
    answer && typeof answer === 'object' && !Array.isArray(answer)
      ? (answer as Record<string, string>)
      : {}
  const assignedDefinitions = new Set(Object.values(assignments))

  function assignDefinition(definitionCardId: string) {
    if (!selectedTerm) return
    const next = Object.fromEntries(
      Object.entries(assignments).filter(([, assigned]) => assigned !== definitionCardId),
    )
    next[selectedTerm] = definitionCardId
    onAnswer(next)
    setSelectedTerm(null)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">Select a term, then select its matching definition.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          {question.pairs.map((pair) => (
            <button
              key={pair.cardId}
              type="button"
              onClick={() => setSelectedTerm(pair.cardId)}
              className={`block w-full rounded-md border p-3 text-left text-sm ${
                selectedTerm === pair.cardId
                  ? 'border-blue-500 bg-blue-50'
                  : assignments[pair.cardId]
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-neutral-300'
              }`}
            >
              {pair.term}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {question.definitions.map((definition) => (
            <button
              key={definition.cardId}
              type="button"
              disabled={!selectedTerm}
              onClick={() => assignDefinition(definition.cardId)}
              className={`block w-full rounded-md border p-3 text-left text-sm disabled:cursor-not-allowed ${
                assignedDefinitions.has(definition.cardId)
                  ? 'border-emerald-300 bg-emerald-50 text-neutral-500'
                  : 'border-neutral-300 disabled:opacity-60'
              }`}
            >
              {definition.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TestQuestionCard({ question, answer, onAnswer }: TestQuestionCardProps) {
  if (question.type === 'matching') {
    return <MatchingQuestion question={question} answer={answer} onAnswer={onAnswer} />
  }

  if (question.type === 'multiple-choice') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-neutral-900">{question.prompt}</h2>
        <div className="grid gap-2">
          {question.options.map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => onAnswer(index)}
              className={`rounded-md border p-3 text-left text-sm ${
                answer === index ? 'border-blue-500 bg-blue-50' : 'border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (question.type === 'written') {
    return (
      <label className="block space-y-4">
        <span className="block text-lg font-medium text-neutral-900">{question.prompt}</span>
        <textarea
          value={typeof answer === 'string' ? answer : ''}
          onChange={(event) => onAnswer(event.target.value)}
          rows={4}
          autoFocus
          placeholder="Type your answer"
          className="w-full rounded-md border border-neutral-300 p-3 text-sm outline-none focus:border-blue-500"
        />
      </label>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-lg font-medium text-neutral-900">{question.term}</p>
        <p className="mt-2 text-neutral-600">{question.definition}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((value) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => onAnswer(value)}
            className={`rounded-md border p-3 text-sm font-medium ${
              answer === value ? 'border-blue-500 bg-blue-50' : 'border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            {value ? 'True' : 'False'}
          </button>
        ))}
      </div>
    </div>
  )
}
