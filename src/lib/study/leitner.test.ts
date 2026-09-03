import { describe, expect, it } from 'vitest'
import { BOX_INTERVAL_DAYS, isMastered, schedule, type CardProgressState } from './leitner'

const now = new Date('2026-06-01T12:00:00')

function progress(overrides: Partial<CardProgressState> = {}): CardProgressState {
  return {
    box: 0,
    consecutive_correct: 0,
    lapses: 0,
    times_seen: 0,
    times_correct: 0,
    due_at: now.toISOString(),
    last_seen_at: null,
    ...overrides,
  }
}

describe('Leitner scheduling', () => {
  it('defines intervals for boxes 0 through 5', () => {
    expect(BOX_INTERVAL_DAYS).toEqual([0, 1, 2, 4, 8, 16])
  })

  it('advances one box on correct answers without exceeding box 5', () => {
    expect(schedule(progress({ box: 2 }), true, null, now).box).toBe(3)
    expect(schedule(progress({ box: 5 }), true, null, now).box).toBe(5)
  })

  it('drops two boxes on wrong answers without going below zero', () => {
    expect(schedule(progress({ box: 3 }), false, null, now).box).toBe(1)
    expect(schedule(progress({ box: 1 }), false, null, now).box).toBe(0)
  })

  it('keeps box zero due immediately and schedules higher boxes from tomorrow', () => {
    expect(schedule(progress({ box: 1 }), false, null, now).due_at).toBe(now.toISOString())
    const due = new Date(schedule(progress({ box: 0 }), true, null, now).due_at)
    expect(due.getDate()).toBe(now.getDate() + 1)
    expect(due.getHours()).toBe(0)
  })

  it('updates answer counters and last-seen time', () => {
    expect(schedule(progress({ consecutive_correct: 2, lapses: 1, times_seen: 5, times_correct: 3 }), true, null, now)).toMatchObject({
      consecutive_correct: 3,
      lapses: 1,
      times_seen: 6,
      times_correct: 4,
      last_seen_at: now.toISOString(),
    })
    expect(schedule(progress({ consecutive_correct: 2, lapses: 1, times_seen: 5, times_correct: 3 }), false, null, now)).toMatchObject({
      consecutive_correct: 0,
      lapses: 2,
      times_seen: 6,
      times_correct: 3,
    })
  })

  it('clamps review to the day before the exam', () => {
    const result = schedule(progress({ box: 4 }), true, new Date('2026-06-05T00:00:00'), now)
    expect(result.due_at).toBe(new Date('2026-06-04T00:00:00').toISOString())
  })

  it('clamps to now when the last review day has passed', () => {
    expect(schedule(progress(), true, new Date('2026-06-01T18:00:00'), now).due_at).toBe(now.toISOString())
  })

  it('considers boxes four and five mastered', () => {
    expect(isMastered({ box: 3 })).toBe(false)
    expect(isMastered({ box: 4 })).toBe(true)
    expect(isMastered({ box: 5 })).toBe(true)
  })
})
