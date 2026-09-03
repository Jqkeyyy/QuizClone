import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { LearnPrompt } from '../components/study/LearnPrompt'
import { SessionSummary } from '../components/study/SessionSummary'
import { useAuth } from '../hooks/useAuth'
import { useCards } from '../hooks/useCards'
import { useLearnSession } from '../hooks/useLearnSession'
import { useSetProgress } from '../hooks/useProgress'
import { useSet } from '../hooks/useSet'
import { isMastered } from '../lib/study/leitner'
import type { Database } from '../types/database'

type CardRow = Database['public']['Tables']['cards']['Row']
type CardProgressRow = Database['public']['Tables']['card_progress']['Row']

interface LearnSessionProps {
  userId: string
  setId: string
  cards: CardRow[]
  initialProgress: CardProgressRow[]
  examDate: string | null
}

function daysUntil(examDate: string | null): number | null {
  if (!examDate) return null
  const [year, month, day] = examDate.split('-').map(Number)
  const today = new Date()
  const difference = Date.UTC(year, month - 1, day) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(0, Math.ceil(difference / 86_400_000))
}

function LearnSession({ userId, setId, cards, initialProgress, examDate }: LearnSessionProps) {
  const session = useLearnSession(userId, setId, cards, initialProgress, examDate)
  const masteryPct = useMemo(() => {
    const mastered = cards.filter((card) => {
      const progress = session.progressByCardId.get(card.id)
      return progress ? isMastered(progress) : false
    }).length
    return cards.length === 0 ? 0 : (mastered / cards.length) * 100
  }, [cards, session.progressByCardId])

  if (session.caughtUp) {
    return (
      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-neutral-900">You’re caught up</h1>
        <p className="text-sm text-neutral-500">Your next scheduled cards unlock later.</p>
        <button type="button" onClick={session.startCram} className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100">
          Cram anyway
        </button>
      </div>
    )
  }

  if (session.isDone) {
    return (
      <SessionSummary
        correct={session.stats.correct}
        total={session.stats.total}
        boxUps={session.boxMovement.boxUps}
        boxDowns={session.boxMovement.boxDowns}
        masteryPct={masteryPct}
        daysUntilExam={daysUntil(examDate)}
        onStudyAgain={session.restart}
      />
    )
  }

  if (!session.currentQuestion) return <p className="text-sm text-neutral-500">Preparing question…</p>

  return (
    <LearnPrompt
      key={`${session.index}-${session.currentQuestion.cardId}`}
      question={session.currentQuestion}
      position={session.index + 1}
      total={session.queueLength}
      onAnswered={session.submitAnswer}
      onAdvance={session.advance}
      onOverride={session.overrideLastAnswer}
    />
  )
}

export default function Learn() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: set, isPending: setPending, isError: setError } = useSet(id)
  const { data: cards, isPending: cardsPending, isError: cardsError } = useCards(id)
  const { data: progress, isPending: progressPending, isError: progressError } = useSetProgress(user?.id, id)

  if (setPending || cardsPending || progressPending) return <p className="text-sm text-neutral-500">Loading…</p>
  if (setError || cardsError || progressError || !set || !user || !id) {
    return <p className="text-sm text-red-600">Set not found or you don’t have access.</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to={`/set/${id}`} className="text-sm text-neutral-500 hover:text-neutral-700">← {set.title}</Link>
      {cards?.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">Add some cards before starting Learn mode.</p>
          {user.id === set.owner_id && <Link to={`/set/${id}/edit`} className="mt-4 inline-block text-sm font-medium underline">Open editor</Link>}
        </div>
      ) : (
        <LearnSession
          key={id}
          userId={user.id}
          setId={id}
          cards={cards ?? []}
          initialProgress={progress ?? []}
          examDate={set.exam_date}
        />
      )}
    </div>
  )
}
