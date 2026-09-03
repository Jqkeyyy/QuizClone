export const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 8, 16] as const

export interface CardProgressState {
  box: number
  consecutive_correct: number
  lapses: number
  times_seen: number
  times_correct: number
  due_at: string
  last_seen_at: string | null
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function startOfTomorrow(now: Date): Date {
  const result = addDays(now, 1)
  result.setHours(0, 0, 0, 0)
  return result
}

export function schedule(
  progress: CardProgressState,
  correct: boolean,
  examDate: Date | null,
  now: Date = new Date(),
): CardProgressState {
  const box = correct ? Math.min(progress.box + 1, 5) : Math.max(progress.box - 2, 0)
  const intervalDays = BOX_INTERVAL_DAYS[box]
  let due = intervalDays === 0 ? now : addDays(startOfTomorrow(now), intervalDays - 1)

  if (examDate) {
    const lastCall = addDays(examDate, -1)
    if (due > lastCall) due = lastCall > now ? lastCall : now
  }

  return {
    box,
    consecutive_correct: correct ? progress.consecutive_correct + 1 : 0,
    lapses: progress.lapses + (correct ? 0 : 1),
    times_seen: progress.times_seen + 1,
    times_correct: progress.times_correct + (correct ? 1 : 0),
    due_at: due.toISOString(),
    last_seen_at: now.toISOString(),
  }
}

export function isMastered(progress: { box: number }): boolean {
  return progress.box >= 4
}
