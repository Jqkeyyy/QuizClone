import type { GradedTest } from '../../lib/study/test'
import { CardImage } from '../cards/CardImage'

export interface TestReviewProps {
  result: GradedTest
  saving: boolean
  saveError: boolean
  onRetrySave: () => void
  onRetake: () => void
  onLearnMissed: () => void
}

export function TestReview({
  result,
  saving,
  saveError,
  onRetrySave,
  onRetake,
  onLearnMissed,
}: TestReviewProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <p className="text-5xl font-semibold text-neutral-900">{result.scorePercent}%</p>
        <p className="mt-2 text-sm text-neutral-500">
          {result.correctCount} of {result.totalCount} cards correct
        </p>
        {saving && <p className="mt-2 text-sm text-neutral-400">Saving result…</p>}
        {saveError && (
          <p className="mt-2 text-sm text-red-600">
            Couldn’t save this result.{' '}
            <button type="button" onClick={onRetrySave} className="underline">Try again</button>
          </p>
        )}
      </section>

      <div className="space-y-3">
        {result.items.map((item, index) => (
          <article
            key={`${item.questionId}-${item.cardId}`}
            className={`rounded-xl border p-4 ${item.correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="font-medium text-neutral-900">{index + 1}. {item.prompt}</p>
              <span className={`text-sm font-medium ${item.correct ? 'text-emerald-700' : 'text-red-700'}`}>
                {item.correct ? (item.near ? 'Close enough' : 'Correct') : 'Incorrect'}
              </span>
            </div>
            <CardImage path={item.promptImage} alt="Question illustration" className="mt-3 max-h-32 max-w-full rounded object-contain object-left" />
            <p className="mt-2 text-sm text-neutral-600">Your answer: {item.userAnswer}</p>
            <CardImage path={item.userAnswerImage} alt="Selected answer illustration" className="mt-2 max-h-24 max-w-full rounded object-contain object-left" />
            {!item.correct && (
              <div className="mt-1">
                <p className="text-sm text-neutral-800">Correct answer: {item.correctAnswer}</p>
                <CardImage path={item.correctAnswerImage} alt="Correct answer illustration" className="mt-2 max-h-24 max-w-full rounded object-contain object-left" />
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {result.missedCardIds.length > 0 && (
          <button
            type="button"
            onClick={onLearnMissed}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Learn the {result.missedCardIds.length} I missed
          </button>
        )}
        <button type="button" onClick={onRetake} className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100">
          Create another test
        </button>
      </div>
    </div>
  )
}
