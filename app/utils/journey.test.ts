import { describe, expect, it } from 'vitest'
import type { Journey, JourneyAttempt } from '~/types/journey'
import {
  attemptBars, attemptState, attemptsSummary, checkpointTrack, climbingJourneys, climbingRows, formatChange, formatCountdown, formatDayRange,
  journeyDay, journeySpans, moodChange, nextFloorText, nextJourneyColor, pastRows,
} from './journey'

const NOW = Date.parse('2026-10-05T20:43:00Z')
const TZ = 'UTC'
const CPS = [1, 3, 7, 14, 30, 60, 90]

const attempt = (id: string, number: number, startedAt: string, endedAt: string | null = null, endReason: JourneyAttempt['endReason'] = null): JourneyAttempt =>
  ({ id, number, startedAt, endedAt, endReason, setbacks: [] })

const journey = (id: string, name: string, lengthDays: number, attempts: JourneyAttempt[], extra: Partial<Journey> = {}): Journey => ({
  id, name, what: '', why: 'Because.', whyWrittenAt: attempts[0]!.startedAt, lengthDays,
  checkpoints: CPS.filter(d => d <= lengthDays), color: 'amber', createdAt: attempts[0]!.startedAt, rules: [], attempts, ...extra,
})

const NICOTINE = journey('nic', 'Nicotine-free', 90, [
  attempt('n1', 1, '2026-08-14T10:00:00Z', '2026-08-17T18:00:00Z', 'setback'),
  attempt('n2', 2, '2026-09-24T10:00:00Z'),
], {
  rules: [
    { kind: 'remove', label: 'Nicotine', suggested: false }, { kind: 'remove', label: 'Vaping', suggested: true },
    { kind: 'allow', label: 'Coffee', suggested: true },
  ],
})
const SLEEP = journey('sleep', 'Fix sleep schedule', 30, [attempt('s1', 1, '2026-10-01T09:00:00Z')], { color: 'blue' })
const READING = journey('read', 'Read every day', 90, [attempt('r1', 1, '2025-09-01T08:00:00Z')])
const DETOX = journey('detox', 'Dopamine detox', 30, [attempt('d1', 1, '2024-10-01T08:00:00Z', '2024-10-08T20:00:00Z', 'paused')])
const ALL = [READING, DETOX, NICOTINE, SLEEP]

describe('days and status', () => {
  it('counts days by elapsed time from the start, to the hour', () => {
    expect(journeyDay('2026-09-24T10:00:00Z', NOW)).toBe(12)
    expect(journeyDay('2026-09-24T10:00:00Z', Date.parse('2026-09-25T09:59:00Z'))).toBe(1)
    expect(journeyDay('2026-09-24T10:00:00Z', Date.parse('2026-09-25T10:00:00Z'))).toBe(2)
  })

  it('ends an attempt by hand or when it has run its length', () => {
    expect(attemptState(NICOTINE.attempts[0]!, 90, NOW)).toMatchObject({ status: 'setback', day: 4 })
    expect(attemptState(NICOTINE.attempts[1]!, 90, NOW)).toEqual({ status: 'active', endMs: null, day: 12 })
    expect(attemptState(READING.attempts[0]!, 90, NOW)).toEqual({ status: 'completed', endMs: Date.parse('2025-11-30T08:00:00Z'), day: 90 })
    expect(climbingJourneys(ALL, NOW).map(j => j.id)).toEqual(['nic', 'sleep'])
  })

  it('turns attempts into Timeline/Journal spans', () => {
    const spans = journeySpans(ALL, NOW, TZ)
    expect(spans.map(s => [s.name, s.start, s.end, s.status, s.statusLabel])).toEqual([
      ['Dopamine detox', '2024-10-01', '2024-10-08', 'stopped', 'Stopped at day 8'],
      ['Read every day', '2025-09-01', '2025-11-29', 'completed', 'Completed · 90 days'],
      ['Nicotine-free · #1', '2026-08-14', '2026-08-17', 'setback', '4 days · setback'],
      ['Nicotine-free · #2', '2026-09-24', null, 'active', 'Day 12 · active'],
      ['Fix sleep schedule', '2026-10-01', null, 'active', 'Day 5 · active'],
    ])
  })

  it('picks the first color nobody uses', () => {
    expect(nextJourneyColor([])).toBe('amber')
    expect(nextJourneyColor(['amber', 'sand'])).toBe('blue')
    expect(nextJourneyColor(['amber', 'blue', 'sand', 'slate'])).toBe('amber')
  })
})

describe('checkpoint track', () => {
  it('places floors on a log scale and fills to now', () => {
    const track = checkpointTrack(CPS, 90, '2026-09-24T10:00:00Z', NOW)
    expect(track.progress).toBeCloseTo(Math.log(12.4535) / Math.log(90), 3)
    expect(track.floors.map(f => [f.label, f.state])).toEqual([
      ['D1', 'reached'], ['D3', 'reached'], ['D7', 'reached'], ['D14', 'next'], ['D30', 'future'], ['D60', 'future'], ['SUMMIT', 'future'],
    ])
    expect(track.floors[0]!.x).toBe(0)
    expect(track.floors.at(-1)!.x).toBe(1)
  })

  it('counts down to the next floor', () => {
    expect(nextFloorText(CPS, 90, '2026-09-24T10:00:00Z', NOW)).toBe('Next floor · Day 14, in 1 day 13 hours')
    expect(nextFloorText([1, 30], 30, '2026-09-06T00:00:00Z', NOW)).toBe('At the summit · completes in 3 hours 17 min')
    expect(formatCountdown(2 * 86_400_000 + 3_600_000)).toBe('2 days 1 hour')
    expect(formatCountdown(12 * 60_000)).toBe('12 min')
  })
})

describe('mood change', () => {
  const mood = { attemptId: 'x', beforeAverage: 5.4, beforeEntries: 30, duringAverage: 5.9, duringEntries: 40 }
  it('compares with the 30 days before, given enough check-ins', () => {
    expect(moodChange(mood)).toBeCloseTo(0.5)
    expect(moodChange({ ...mood, duringEntries: 2 })).toBeNull()
    expect(moodChange(undefined)).toBeNull()
    expect([formatChange(0.5), formatChange(-0.26), formatChange(0.01), formatChange(null)]).toEqual(['+0.5', '−0.3', '0.0', '—'])
  })
})

describe('journeys list', () => {
  const moods = new Map([['n2', { attemptId: 'n2', beforeAverage: 5.3, beforeEntries: 120, duringAverage: 5.8, duringEntries: 60 }]])

  it('describes what is being climbed', () => {
    const [nicotine, sleep] = climbingRows(ALL, moods, NOW, TZ)
    expect(nicotine).toMatchObject({ day: 12, meta: 'Attempt 2 · Started 24 Sep · 2 removed, 1 allowed', next: 'Next floor · Day 14, in 1 day 13 hours' })
    expect(nicotine!.change).toBeCloseTo(0.5)
    expect(sleep).toMatchObject({ day: 5, meta: 'Started 1 Oct', change: null })
  })

  it('compares attempts', () => {
    const bars = attemptBars(NICOTINE, NOW, TZ)
    expect(bars.map(b => [b.number, b.days, b.label])).toEqual([[1, 4, '4 days · 14–17 Aug'], [2, 12, '12 days and counting']])
    expect(bars[0]!.width).toBeCloseTo(4 / 14)
    expect(bars[1]!.width).toBeCloseTo(12 / 14)
    expect(attemptsSummary(bars)).toBe('Attempt #1 ended on Day 4. Attempt #2 is already three times as long.')
  })

  it('lists what is behind you, most recent first', () => {
    expect(pastRows(ALL, new Map(), NOW, TZ).map(r => [r.name, r.dates, r.status])).toEqual([
      ['Nicotine-free · Attempt 1', '14 – 17 Aug 2026 · 4 days', 'Setback, Day 4'],
      ['Read every day', '1 Sep – 29 Nov 2025 · 90 days', 'Completed'],
      ['Dopamine detox', '1 – 8 Oct 2024 · 8 days', 'Paused on Day 8'],
    ])
  })

  it('formats day ranges like the design', () => {
    expect(formatDayRange('2026-08-14', '2026-08-17')).toBe('14–17 Aug')
    expect(formatDayRange('2026-07-28', '2026-08-02')).toBe('28 Jul – 2 Aug')
    expect(formatDayRange('2025-12-28', '2026-01-03', true)).toBe('28 Dec 2025 – 3 Jan 2026')
  })
})
