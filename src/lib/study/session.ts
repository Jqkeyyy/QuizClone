import type { Database } from '../../types/database'
import { shuffle } from './shuffle'

type CardRow = Database['public']['Tables']['cards']['Row']
type CardProgressRow = Database['public']['Tables']['card_progress']['Row']

export const NEW_PER_SESSION = 15
export const SESSION_SIZE = 25

export function buildLearnSession(
  cards: CardRow[],
  progressByCardId: Map<string, CardProgressRow>,
  now: Date = new Date(),
): string[] {
  const due: string[] = []
  const fresh: string[] = []

  for (const card of cards) {
    const progress = progressByCardId.get(card.id)
    if (!progress) fresh.push(card.id)
    else if (new Date(progress.due_at) <= now) due.push(card.id)
  }

  const shuffledDue = shuffle(due)
  const cappedFresh = fresh.slice(0, NEW_PER_SESSION)
  const queue: string[] = []
  let freshIndex = 0

  for (let dueIndex = 0; dueIndex < shuffledDue.length; dueIndex++) {
    queue.push(shuffledDue[dueIndex])
    if ((dueIndex + 1) % 3 === 0 && freshIndex < cappedFresh.length) {
      queue.push(cappedFresh[freshIndex++])
    }
  }
  while (freshIndex < cappedFresh.length) queue.push(cappedFresh[freshIndex++])

  return queue.slice(0, SESSION_SIZE)
}

export function buildCramSession(
  cards: CardRow[],
  progressByCardId: Map<string, CardProgressRow>,
  now: Date = new Date(),
): string[] {
  return cards
    .map((card) => {
      const progress = progressByCardId.get(card.id)
      const seen = progress?.times_seen ?? 0
      const accuracy = seen === 0 ? 0 : (progress?.times_correct ?? 0) / seen
      const lastSeen = progress?.last_seen_at ? new Date(progress.last_seen_at) : null
      const daysSinceSeen = lastSeen ? Math.max(0, now.getTime() - lastSeen.getTime()) / 86_400_000 : 7
      const recencyWeight = Math.min(daysSinceSeen / 7, 1)
      return { id: card.id, weight: (1 - accuracy) * recencyWeight }
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, SESSION_SIZE)
    .map(({ id }) => id)
}

export function requeue(queue: string[], currentIndex: number): string[] {
  const cardId = queue[currentIndex]
  if (!cardId) return queue
  const offset = 4 + Math.floor(Math.random() * 3)
  const insertionIndex = Math.min(currentIndex + offset, queue.length)
  return [...queue.slice(0, insertionIndex), cardId, ...queue.slice(insertionIndex)]
}
