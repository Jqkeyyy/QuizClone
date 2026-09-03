export interface FeedbackBannerProps {
  correct: boolean
  near: boolean
  correctAnswer: string
  onOverride?: () => void
}

export function FeedbackBanner({ correct, near, correctAnswer, onOverride }: FeedbackBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-md border px-4 py-3 text-sm ${
        correct ? 'border-green-400 bg-green-50 text-green-800' : 'border-red-400 bg-red-50 text-red-800'
      }`}
    >
      {correct ? (
        <p>{near ? <>Close — the answer is “{correctAnswer}”</> : 'Correct!'}</p>
      ) : (
        <div className="space-y-2">
          <p>Not quite — the answer is “{correctAnswer}”</p>
          {onOverride && (
            <button type="button" onClick={onOverride} className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-100">
              I was right
            </button>
          )}
        </div>
      )}
    </div>
  )
}
