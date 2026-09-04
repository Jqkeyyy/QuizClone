import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Database } from '../types/database'
import * as progressDb from '../lib/db/progress'
import * as sessionsDb from '../lib/db/studySessions'
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
  seededCardIds: string[] = [],
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
  const [queue, setQueue] = useState(() =>
    seededCardIds.length > 0
      ? seededCardIds.filter((cardId) => cardsById.has(cardId))
      : buildLearnSession(cards, progressByCardId),
  )
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<'learn' | 'cram' | 'seeded'>(
    seededCardIds.length > 0 ? 'seeded' : 'learn',
  )
  const [stats, setStats] = useState({ correct: 0, total: 0 })
  const [lastAnswer, setLastAnswer] = useState<LastAnswer | null>(null)

  const dirtyRef = useRef<Map<string, CardProgressRow>>(new Map())
  const answeredSinceFlushRef = useRef(0)
  const statsRef = useRef(stats)
  const studySessionRef = useRef<Promise<Database['public']['Tables']['study_sessions']['Row'] | null> | null>(null)

  const ensureStudySession = useCallback(() => {
    if (studySessionRef.current) return
    const sessionMode = mode === 'cram' ? 'cram' : 'learn'
    studySessionRef.current = sessionsDb.createStudySession(userId, setId, sessionMode).catch((error: unknown) => {
      console.error('Could not start study session:', error)
      return null
    })
  }, [mode, setId, userId])

  const finishStudySession = useCallback(async () => {
    const sessionPromise = studySessionRef.current
    if (!sessionPromise) return
    studySessionRef.current = null

    const session = await sessionPromise
    if (!session) return
    try {
      await sessionsDb.finishStudySession(session.id, statsRef.current.total, statsRef.current.correct)
      await queryClient.invalidateQueries({ queryKey: ['study-sessions', setId, userId] })
    } catch (error) {
      console.error('Could not finish study session:', error)
    }
  }, [queryClient, setId, userId])

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
  useEffect(() => () => { void finishStudySession() }, [finishStudySession])

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

  useEffect(() => {
    if (isDone) void finishStudySession()
  }, [finishStudySession, isDone])

  const submitAnswer = useCallback(
    (correct: boolean) => {
      if (!currentCard || lastAnswer) return
      ensureStudySession()
      const now = new Date()
      const existing = progressByCardId.get(currentCard.id)
      const previous = existing ?? buildProgressRow(userId, setId, currentCard.id, false, emptyProgressState(now))
      const nextState = schedule(toProgressState(previous), correct, examDateObject, now)
      const nextRow = buildProgressRow(userId, setId, currentCard.id, previous.starred, nextState)

      setProgressByCardId((current) => new Map(current).set(currentCard.id, nextRow))
      dirtyRef.current.set(currentCard.id, nextRow)
      answeredSinceFlushRef.current += 1
      const nextStats = {
        correct: statsRef.current.correct + (correct ? 1 : 0),
        total: statsRef.current.total + 1,
      }
      statsRef.current = nextStats
      setStats(nextStats)
      setLastAnswer({ cardId: currentCard.id, previousProgress: previous, correct, overridden: false })

      if (!correct) setQueue((current) => requeue(current, index))
      if (answeredSinceFlushRef.current >= FLUSH_EVERY) safelyFlush()
    },
    [currentCard, ensureStudySession, examDateObject, index, lastAnswer, progressByCardId, safelyFlush, setId, userId],
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
    const nextStats = { correct: statsRef.current.correct + 1, total: statsRef.current.total }
    statsRef.current = nextStats
    setStats(nextStats)
    setLastAnswer((current) => current && { ...current, correct: true, overridden: true })
  }, [examDateObject, lastAnswer, setId, userId])

  const startCram = useCallback(() => {
    setStartingBoxByCardId(new Map([...progressByCardId].map(([cardId, row]) => [cardId, row.box])))
    setMode('cram')
    setQueue(buildCramSession(cards, progressByCardId))
    setIndex(0)
    setStats({ correct: 0, total: 0 })
    statsRef.current = { correct: 0, total: 0 }
    setLastAnswer(null)
  }, [cards, progressByCardId])

  const restart = useCallback(() => {
    setStartingBoxByCardId(new Map([...progressByCardId].map(([cardId, row]) => [cardId, row.box])))
    const seeded = seededCardIds.filter((cardId) => cardsById.has(cardId))
    setMode(seeded.length > 0 ? 'seeded' : 'learn')
    setQueue(seeded.length > 0 ? seeded : buildLearnSession(cards, progressByCardId))
    setIndex(0)
    setStats({ correct: 0, total: 0 })
    statsRef.current = { correct: 0, total: 0 }
    setLastAnswer(null)
  }, [cards, cardsById, progressByCardId, seededCardIds])

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
