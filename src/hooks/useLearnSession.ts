import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Database } from '../types/database'
import * as progressDb from '../lib/db/progress'
import { schedule, type CardProgressState } from '../lib/study/leitner'
import { buildCramSession, buildLearnSession, requeue } from '../lib/study/session'
import { buildQuestion, type Question } from '../lib/study/questions'

type CardRow = Database['public']['Tables']['cards']['Row']
type CardProgressRow = Database['public']['Tables']['card_progress']['Row']

const FLUSH_EVERY = 5

interface LastAnswer {
  cardId: string
  previousProgress: CardProgressRow
  correct: boolean
  overridden: boolean
}

function toProgressState(row: CardProgressRow): CardProgressState {
  return {
    box: row.box,
    consecutive_correct: row.consecutive_correct,
    lapses: row.lapses,
    times_seen: row.times_seen,
    times_correct: row.times_correct,
    due_at: row.due_at,
    last_seen_at: row.last_seen_at,
  }
}

function emptyProgressState(now: Date): CardProgressState {
  return {
    box: 0,
    consecutive_correct: 0,
    lapses: 0,
    times_seen: 0,
    times_correct: 0,
    due_at: now.toISOString(),
    last_seen_at: null,
  }
}

function buildProgressRow(
  userId: string,
  setId: string,
  cardId: string,
  starred: boolean,
  state: CardProgressState,
): CardProgressRow {
  return { user_id: userId, card_id: cardId, set_id: setId, starred, ...state }
}

function parseLocalDate(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00`) : null
}

export function useLearnSession(
  userId: string,
  setId: string,
  cards: CardRow[],
  initialProgress: CardProgressRow[],
  examDate: string | null,
) {
  const queryClient = useQueryClient()
  const cardsById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards])
  const examDateObject = useMemo(() => parseLocalDate(examDate), [examDate])
  const [startingBoxByCardId, setStartingBoxByCardId] = useState(
    () => new Map(initialProgress.map((row) => [row.card_id, row.box])),
  )
  const [progressByCardId, setProgressByCardId] = useState(
    () => new Map(initialProgress.map((row) => [row.card_id, row])),
  )
  const [queue, setQueue] = useState(() => buildLearnSession(cards, progressByCardId))
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<'learn' | 'cram'>('learn')
  const [stats, setStats] = useState({ correct: 0, total: 0 })
  const [lastAnswer, setLastAnswer] = useState<LastAnswer | null>(null)

  const dirtyRef = useRef<Map<string, CardProgressRow>>(new Map())
  const answeredSinceFlushRef = useRef(0)

  const flush = useCallback(async () => {
    const pendingRows = Array.from(dirtyRef.current.values())
    if (pendingRows.length === 0) return
    dirtyRef.current = new Map()
    answeredSinceFlushRef.current = 0

    try {
      await progressDb.flushProgress(
        pendingRows.map((row) => ({
          user_id: row.user_id,
          card_id: row.card_id,
          set_id: row.set_id,
          box: row.box,
          consecutive_correct: row.consecutive_correct,
          lapses: row.lapses,
          times_seen: row.times_seen,
          times_correct: row.times_correct,
          due_at: row.due_at,
          last_seen_at: row.last_seen_at,
        })),
      )
      await queryClient.invalidateQueries({ queryKey: ['progress', 'full', setId, userId] })
    } catch (error) {
      for (const row of pendingRows) {
        if (!dirtyRef.current.has(row.card_id)) dirtyRef.current.set(row.card_id, row)
      }
      answeredSinceFlushRef.current = FLUSH_EVERY
      throw error
    }
  }, [queryClient, setId, userId])

  const safelyFlush = useCallback(() => {
    void flush().catch((error: unknown) => console.error('Could not save Learn progress:', error))
  }, [flush])

  useEffect(() => () => safelyFlush(), [safelyFlush])

  const isDone = index >= queue.length
  const currentCardId = isDone ? null : queue[index]
  const currentCard = currentCardId ? (cardsById.get(currentCardId) ?? null) : null
  const questionBox = currentCard
    ? lastAnswer?.cardId === currentCard.id
      ? lastAnswer.previousProgress.box
      : (progressByCardId.get(currentCard.id)?.box ?? 0)
    : 0
  const currentQuestion: Question | null = useMemo(
    () => (currentCard ? buildQuestion(currentCard, cards, questionBox) : null),
    [cards, currentCard, questionBox],
  )

  useEffect(() => {
    if (isDone) safelyFlush()
  }, [isDone, safelyFlush])

  const submitAnswer = useCallback(
    (correct: boolean) => {
      if (!currentCard || lastAnswer) return
      const now = new Date()
      const existing = progressByCardId.get(currentCard.id)
      const previous = existing ?? buildProgressRow(userId, setId, currentCard.id, false, emptyProgressState(now))
      const nextState = schedule(toProgressState(previous), correct, examDateObject, now)
      const nextRow = buildProgressRow(userId, setId, currentCard.id, previous.starred, nextState)

      setProgressByCardId((current) => new Map(current).set(currentCard.id, nextRow))
      dirtyRef.current.set(currentCard.id, nextRow)
      answeredSinceFlushRef.current += 1
      setStats((current) => ({
        correct: current.correct + (correct ? 1 : 0),
        total: current.total + 1,
      }))
      setLastAnswer({ cardId: currentCard.id, previousProgress: previous, correct, overridden: false })

      if (!correct) setQueue((current) => requeue(current, index))
      if (answeredSinceFlushRef.current >= FLUSH_EVERY) safelyFlush()
    },
    [currentCard, examDateObject, index, lastAnswer, progressByCardId, safelyFlush, setId, userId],
  )

  const advance = useCallback(() => {
    if (!lastAnswer) return
    setIndex((current) => current + 1)
    setLastAnswer(null)
  }, [lastAnswer])

  const overrideLastAnswer = useCallback(() => {
    if (!lastAnswer || lastAnswer.correct || lastAnswer.overridden) return
    const now = new Date()
    const correctedState = schedule(toProgressState(lastAnswer.previousProgress), true, examDateObject, now)
    const correctedRow = buildProgressRow(
      userId,
      setId,
      lastAnswer.cardId,
      lastAnswer.previousProgress.starred,
      correctedState,
    )

    setProgressByCardId((current) => new Map(current).set(lastAnswer.cardId, correctedRow))
    dirtyRef.current.set(lastAnswer.cardId, correctedRow)
    setStats((current) => ({ correct: current.correct + 1, total: current.total }))
    setLastAnswer((current) => current && { ...current, correct: true, overridden: true })
  }, [examDateObject, lastAnswer, setId, userId])

  const startCram = useCallback(() => {
    setStartingBoxByCardId(new Map([...progressByCardId].map(([cardId, row]) => [cardId, row.box])))
    setMode('cram')
    setQueue(buildCramSession(cards, progressByCardId))
    setIndex(0)
    setStats({ correct: 0, total: 0 })
    setLastAnswer(null)
  }, [cards, progressByCardId])

  const restart = useCallback(() => {
    setStartingBoxByCardId(new Map([...progressByCardId].map(([cardId, row]) => [cardId, row.box])))
    setMode('learn')
    setQueue(buildLearnSession(cards, progressByCardId))
    setIndex(0)
    setStats({ correct: 0, total: 0 })
    setLastAnswer(null)
  }, [cards, progressByCardId])

  const boxMovement = useMemo(() => {
    let boxUps = 0
    let boxDowns = 0
    for (const [cardId, row] of progressByCardId) {
      const startingBox = startingBoxByCardId.get(cardId) ?? 0
      if (row.box > startingBox) boxUps++
      else if (row.box < startingBox) boxDowns++
    }
    return { boxUps, boxDowns }
  }, [progressByCardId, startingBoxByCardId])

  return {
    currentQuestion,
    index,
    queueLength: queue.length,
    isDone,
    caughtUp: queue.length === 0 && mode === 'learn',
    stats,
    boxMovement,
    progressByCardId,
    lastAnswer,
    submitAnswer,
    advance,
    overrideLastAnswer,
    startCram,
    restart,
    mode,
  }
}
