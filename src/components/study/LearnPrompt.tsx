import { useState } from 'react'
import { useKeyboard } from '../../hooks/useKeyboard'
import { gradeTyped } from '../../lib/study/grading'
import type { Question } from '../../lib/study/questions'
import { ChoiceGrid } from './ChoiceGrid'
import { FeedbackBanner } from './FeedbackBanner'
import { TypedAnswer } from './TypedAnswer'

export interface LearnPromptProps {
  question: Question
  position: number
  total: number
  onAnswered: (correct: boolean) => void
  onAdvance: () => void
  onOverride: () => void
}

export function LearnPrompt({ question, position, total, onAnswered, onAdvance, onOverride }: LearnPromptProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [typedResult, setTypedResult] = useState<{ correct: boolean; near: boolean } | null>(null)
  const answered = question.type === 'multiple-choice' ? selectedIndex !== null : typedResult !== null

  function handleSelect(index: number) {
    if (question.type !== 'multiple-choice' || answered || !question.options[index]) return
    setSelectedIndex(index)
    onAnswered(index === question.correctIndex)
  }

  function handleTypedSubmit(value: string) {
    if (question.type !== 'typed' || answered) return
    const result = gradeTyped(value, question.correctAnswer)
    setTypedResult(result)
    onAnswered(result.correct)
  }

  function handleOverride() {
    setTypedResult((current) => current && { correct: true, near: false })
    onOverride()
  }

  useKeyboard({
    '1': () => handleSelect(0),
    '2': () => handleSelect(1),
    '3': () => handleSelect(2),
    '4': () => handleSelect(3),
    '5': () => handleSelect(4),
    '6': () => handleSelect(5),
    Enter: () => {
      if (answered) onAdvance()
    },
  })

  const progress = total === 0 ? 0 : (position / total) * 100
  const correct = question.type === 'multiple-choice'
    ? selectedIndex === question.correctIndex
    : (typedResult?.correct ?? false)
  const correctAnswer = question.type === 'multiple-choice'
    ? question.options[question.correctIndex]
    : question.correctAnswer

  return (
    <div className="flex flex-col gap-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200" aria-hidden="true">
        <div className="h-full bg-neutral-900 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-sm text-neutral-500">{position} / {total}</p>

      <div className="flex min-h-40 items-center justify-center rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <h1 className="text-2xl text-neutral-900">{question.prompt}</h1>
      </div>

      {question.type === 'multiple-choice' ? (
        <ChoiceGrid options={question.options} selectedIndex={selectedIndex} correctIndex={answered ? question.correctIndex : null} onSelect={handleSelect} />
      ) : (
        <TypedAnswer disabled={answered} onSubmit={handleTypedSubmit} />
      )}

      {answered && (
        <>
          <FeedbackBanner
            correct={correct}
            near={typedResult?.near ?? false}
            correctAnswer={correctAnswer}
            onOverride={question.type === 'typed' && typedResult && !typedResult.correct ? handleOverride : undefined}
          />
          <button type="button" autoFocus onClick={onAdvance} className="self-center rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">
            Next (Enter)
          </button>
        </>
      )}
    </div>
  )
}
