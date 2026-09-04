import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { CardImage } from '../components/cards/CardImage'
import { useAuth } from '../hooks/useAuth'
import { useCards } from '../hooks/useCards'
import { useResetSetProgress, useSetProgress } from '../hooks/useProgress'
import { useSet } from '../hooks/useSet'
import { useStudySessions } from '../hooks/useStudySessions'
import { useTestAttempts } from '../hooks/useTestResult'
import { summarizeProgress, summarizeStudySessions, summarizeTests } from '../lib/study/stats'
import { readSavedTestItems } from '../lib/study/history'

function formatAttemptDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
      {detail && <p className="mt-1 text-xs text-neutral-400">{detail}</p>}
    </div>
  )
}

function ResetProgress({ userId, setId }: { userId: string; setId: string }) {
  const resetProgress = useResetSetProgress(userId, setId)

  function handleReset() {
    const confirmed = window.confirm(
      'Reset all progress for this set? This permanently removes your card mastery, stars, Learn history, and test history.',
    )
    if (confirmed) resetProgress.mutate()
  }

  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-5">
      <h2 className="font-medium text-red-900">Reset progress</h2>
      <p className="mt-1 text-sm text-red-700">
        Clear your personal mastery, starred cards, Learn sessions, and saved test attempts for this set.
      </p>
      {resetProgress.isError && <p role="alert" className="mt-3 text-sm text-red-700">Could not reset progress. Please try again.</p>}
      <button
        type="button"
        disabled={resetProgress.isPending}
        onClick={handleReset}
        className="mt-4 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        {resetProgress.isPending ? 'Resetting…' : 'Reset all progress'}
      </button>
    </section>
  )
}

export default function Stats() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: set, isPending: setPending, isError: setError } = useSet(id)
  const { data: cards, isPending: cardsPending, isError: cardsError } = useCards(id)
  const { data: progress, isPending: progressPending, isError: progressError } = useSetProgress(user?.id, id)
  const { data: attempts, isPending: attemptsPending, isError: attemptsError } = useTestAttempts(user?.id, id)
  const { data: sessions, isPending: sessionsPending, isError: sessionsError } = useStudySessions(user?.id, id)
  const progressSummary = useMemo(
    () => summarizeProgress((cards ?? []).map((card) => card.id), progress ?? []),
    [cards, progress],
  )
  const testSummary = useMemo(() => summarizeTests(attempts ?? []), [attempts])
  const sessionSummary = useMemo(() => summarizeStudySessions(sessions ?? []), [sessions])

  if (setPending || cardsPending || progressPending || attemptsPending || sessionsPending) {
    return <p className="text-sm text-neutral-500">Loading progress…</p>
  }
  if (setError || cardsError || progressError || attemptsError || sessionsError || !set || !user || !id) {
    return <p className="text-sm text-red-600">Could not load progress for this set.</p>
  }

  const maxBoxCount = Math.max(1, ...progressSummary.boxes)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to={`/set/${id}`} className="text-sm text-neutral-500 hover:text-neutral-700">← {set.title}</Link>
        <h1 className="mt-3 text-xl font-semibold text-neutral-900">Progress</h1>
        <p className="mt-1 text-sm text-neutral-500">Your personal learning activity for this set.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Mastery" value={`${progressSummary.masteryPercent}%`} detail={`${progressSummary.masteredCards} of ${progressSummary.totalCards} cards`} />
        <StatCard label="Reviews due" value={progressSummary.reviewsDue} detail="Previously studied cards" />
        <StatCard label="Answer accuracy" value={progressSummary.accuracyPercent === null ? '—' : `${progressSummary.accuracyPercent}%`} detail={`${progressSummary.correctAnswers} of ${progressSummary.answers} correct`} />
        <StatCard label="Tests taken" value={testSummary.attemptCount} detail={testSummary.bestScore === null ? 'No saved tests' : `Best score ${testSummary.bestScore}%`} />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-medium text-neutral-900">Learn history</h2>
          <span className="text-sm text-neutral-500">{sessionSummary.sessionCount} sessions</span>
        </div>
        {sessionSummary.sessionCount === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">Completed Learn and cram sessions will appear here.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-neutral-500">
              {sessionSummary.correctAnswers} of {sessionSummary.answers} answers correct
              {sessionSummary.accuracyPercent === null ? '' : ` (${sessionSummary.accuracyPercent}%)`}.
            </p>
            <ul className="mt-3 divide-y divide-neutral-200">
              {sessions.filter((session) => session.cards_seen > 0).slice(0, 10).map((session) => (
                <li key={session.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm capitalize text-neutral-700">{session.mode}</p>
                    <p className="text-xs text-neutral-400">{formatAttemptDate(session.started_at)}</p>
                  </div>
                  <strong className="text-sm text-neutral-900">{session.cards_correct} / {session.cards_seen}</strong>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-medium text-neutral-900">Card progress</h2>
          <span className="text-sm text-neutral-500">{progressSummary.studiedCards} studied</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-100" aria-label={`${progressSummary.masteryPercent}% mastered`}>
          <div className="h-full bg-emerald-500" style={{ width: `${progressSummary.masteryPercent}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
          <div><strong className="block text-neutral-900">{progressSummary.notStartedCards}</strong><span className="text-neutral-500">Not started</span></div>
          <div><strong className="block text-neutral-900">{progressSummary.learningCards}</strong><span className="text-neutral-500">Learning</span></div>
          <div><strong className="block text-neutral-900">{progressSummary.masteredCards}</strong><span className="text-neutral-500">Mastered</span></div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="font-medium text-neutral-900">Leitner boxes</h2>
        <p className="mt-1 text-sm text-neutral-500">Cards move into higher boxes as you answer correctly.</p>
        <div className="mt-5 flex h-40 items-end gap-3" role="img" aria-label={`Cards by box: ${progressSummary.boxes.join(', ')}`}>
          {progressSummary.boxes.map((count, box) => (
            <div key={box} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center">
              <span className="mb-1 text-xs font-medium text-neutral-600">{count}</span>
              <div
                className="min-h-1 rounded-t bg-blue-500"
                style={{ height: `${Math.max(count === 0 ? 2 : 10, (count / maxBoxCount) * 100)}%` }}
              />
              <span className="mt-2 text-xs text-neutral-500">Box {box}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-medium text-neutral-900">Test history</h2>
          {testSummary.averageScore !== null && <span className="text-sm text-neutral-500">Average {testSummary.averageScore}%</span>}
        </div>
        {attempts.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">Completed tests will appear here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200">
            {attempts.slice(0, 10).map((attempt) => {
              const savedItems = readSavedTestItems(attempt.answers)
              return <li key={attempt.id} className="py-3">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500">
                    <div>
                      <p className="text-sm text-neutral-700">{attempt.question_count} questions</p>
                      <p className="text-xs text-neutral-400">{formatAttemptDate(attempt.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <strong className="text-lg text-neutral-900">{attempt.score}%</strong>
                      <span aria-hidden="true" className="text-neutral-400 transition group-open:rotate-180">▾</span>
                    </div>
                  </summary>
                  {savedItems.length === 0 ? (
                    <p className="mt-3 rounded-md bg-neutral-50 p-3 text-sm text-neutral-500">
                      Detailed answers are unavailable for this attempt.
                    </p>
                  ) : (
                    <ol className="mt-3 space-y-2">
                      {savedItems.map((item, index) => (
                        <li
                          key={`${item.questionId}-${item.cardId}-${index}`}
                          className={`rounded-md border p-3 ${item.correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-neutral-900">{index + 1}. {item.prompt}</p>
                            <span className={`text-xs font-medium ${item.correct ? 'text-emerald-700' : 'text-red-700'}`}>
                              {item.correct ? (item.near ? 'Close enough' : 'Correct') : 'Incorrect'}
                            </span>
                          </div>
                          <CardImage path={item.promptImage} alt="Question illustration" className="mt-2 max-h-28 max-w-full rounded object-contain object-left" />
                          <p className="mt-2 text-xs text-neutral-600">Your answer: {item.userAnswer}</p>
                          <CardImage path={item.userAnswerImage} alt="Selected answer illustration" className="mt-2 max-h-20 max-w-full rounded object-contain object-left" />
                          {!item.correct && (
                            <div className="mt-1">
                              <p className="text-xs text-neutral-800">Correct answer: {item.correctAnswer}</p>
                              <CardImage path={item.correctAnswerImage} alt="Correct answer illustration" className="mt-2 max-h-20 max-w-full rounded object-contain object-left" />
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </details>
              </li>
            })}
          </ul>
        )}
      </section>

      <ResetProgress userId={user.id} setId={id} />
    </div>
  )
}
