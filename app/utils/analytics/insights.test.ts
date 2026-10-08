import { describe, expect, it } from 'vitest'
import type { JourneySpan } from '~/types/journey'
import type { MoodEntry } from '~/types/mood'
import { levelFromScore } from '~/utils/mood'
import {
  comparisonX, evidenceLevel, evidenceText, formatSigned, hourChartY, hourStats, hourX, insightsModel, isInsightsRange, journeyComparison, rangeStart, tagBars,
  tagStats, weekdayAverages,
} from './insights'

const TZ = 'UTC'
let n = 0
const entry = (day: string, time: string, score: number, tags: string[] = [], note = ''): MoodEntry => ({
  id: `e${n++}`, loggedAt: `${day}T${time}:00.000Z`, level: levelFromScore(score), score, note, tags,
})

describe('ranges and evidence', () => {
  it('counts days back from today and validates the URL value', () => {
    expect(rangeStart(30, '2026-10-05')).toBe('2026-09-06')
    expect(rangeStart('all', '2026-10-05')).toBeNull()
    expect([isInsightsRange('90'), isInsightsRange('all'), isInsightsRange('7')]).toEqual([true, true, false])
  })

  it('grades evidence by entry count', () => {
    expect([evidenceLevel(39), evidenceLevel(40), evidenceLevel(120)]).toEqual([1, 2, 3])
    expect(evidenceText(1284)).toBe('Strong evidence · 1,284 entries')
    expect(evidenceText(12)).toBe('Early signal · 12 entries')
  })
})

describe('time of day and weekdays', () => {
  it('averages each hour with its middle half, skipping thin hours', () => {
    const entries = [entry('2026-10-01', '10:05', 3), entry('2026-10-02', '10:30', 5), entry('2026-10-03', '10:59', 4), entry('2026-10-04', '10:10', 8), entry('2026-10-01', '20:00', 8)]
    expect(hourStats(entries, TZ)).toEqual([{ hour: 10, average: 5, q1: 4, q3: 8, entries: 4 }])
  })

  it('puts Monday first', () => {
    const days = weekdayAverages([entry('2026-10-05', '09:00', 6), entry('2026-10-11', '09:00', 8)], TZ) // Mon, Sun
    expect(days).toEqual([6, null, null, null, null, null, 8])
  })

  it('maps the hour chart like the design, with labels on their gridlines', () => {
    expect(hourChartY(8.75, 200)).toBeCloseTo(20)
    expect(hourChartY(2.5, 200)).toBeCloseTo(180)
    expect(hourChartY(1, 200)).toBeCloseTo(180)
    expect(hourX(7)).toBeCloseTo(0.5 / 17)
  })
})

describe('tags', () => {
  // Five days: Gym in the evening lifts the next hours; Work in the morning sits low.
  const entries = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'].flatMap(day => [
    entry(day, '09:00', 4, ['Work'], day === '2026-10-05' ? 'Deadline stress.' : ''),
    entry(day, '17:00', 5),
    entry(day, '18:00', 6, ['Gym'], 'Gym felt great.'),
    entry(day, '20:00', 8),
  ])

  it('compares tagged entries with the average and what came after', () => {
    const [gym, work] = tagStats(entries, entries, TZ)
    expect(gym).toMatchObject({ tag: 'Gym', entries: 5, difference: 0.25, withAverage: 6, after: 3, up: 5, cases: 5 })
    expect(gym!.withoutAverage).toBeCloseTo(17 / 3)
    expect(gym!.notes).toHaveLength(3)
    expect(work).toMatchObject({ tag: 'Work', difference: -1.75, cases: 0, after: null })
    expect(work!.notes.map(x => x.note)).toEqual(['Deadline stress.'])
  })

  it('draws diverging bars scaled to the largest difference', () => {
    const bars = tagBars(tagStats(entries, entries, TZ))
    expect(bars[0]).toMatchObject({ tag: 'Gym', lower: null, higher: { label: '+0.3' } })
    expect(bars[0]!.higher!.width).toBeCloseTo((0.25 / 1.75) * 0.88)
    expect(bars[1]).toMatchObject({ tag: 'Work', higher: null, lower: { width: 0.88, label: '−1.8' }, level: 1 })
    expect(formatSigned(-0.02)).toBe('+0.0')
  })
})

describe('worth noticing', () => {
  it('finds the low stretch, a rise after a tag, tiredness, a heavy tag and the best weekday', () => {
    const entries: MoodEntry[] = []
    for (let d = 1; d <= 28; d++) {
      const day = `2026-09-${String(d).padStart(2, '0')}`
      const sunday = d % 7 === 6 // 2026-09-06 is a Sunday
      entries.push(entry(day, '08:00', 5))
      entries.push(entry(day, '11:00', d <= 6 ? 2 : 3, d <= 6 ? ['Tired'] : ['Work']))
      entries.push(entry(day, '12:00', 4, ['Work']))
      entries.push(entry(day, '18:00', 5, ['Gym']))
      entries.push(entry(day, '20:00', sunday ? 9 : 7))
    }
    const model = insightsModel(entries, TZ)
    expect(model.notices.map(x => x.text)).toEqual([
      'Your mood was generally lowest between 11:00 and 13:00.',
      'Your mood often rose in the few hours after logging Gym. It went up 28 out of 28 times you checked in before and after.',
      '6 of your 28 lowest entries mentioned tiredness or poor sleep.',
      'Entries tagged Work sat 1.3 points below your average.',
    ])
    expect(model.notices[0]!.entries).toBe(56)
  })
})

describe('journeys', () => {
  it('compares before and during for attempts with enough check-ins, newest first', () => {
    const spans: JourneySpan[] = [
      { id: 'a', name: 'Read every day', start: '2025-09-01', end: '2025-11-29', status: 'completed', statusLabel: 'Completed · 90 days' },
      { id: 'b', name: 'Nicotine-free · #2', start: '2026-09-24', end: null, status: 'active', statusLabel: 'Day 12 · active' },
      { id: 'c', name: 'New', start: '2026-10-04', end: null, status: 'active', statusLabel: 'Day 2 · active' },
    ]
    const moods = new Map([
      ['a', { attemptId: 'a', beforeAverage: 5.2, beforeEntries: 90, duringAverage: 5.6, duringEntries: 300 }],
      ['b', { attemptId: 'b', beforeAverage: 5.8, beforeEntries: 120, duringAverage: 5.3, duringEntries: 60 }],
      ['c', { attemptId: 'c', beforeAverage: 5.8, beforeEntries: 120, duringAverage: 6, duringEntries: 2 }],
    ])
    const rows = journeyComparison(spans, moods)
    expect(rows.map(r => r.name)).toEqual(['Nicotine-free · #2', 'Read every day'])
    expect(rows[0]!.change).toBeCloseTo(-0.5)
    expect([comparisonX(3), comparisonX(5.5), comparisonX(9)]).toEqual([0, 0.5, 1])
  })
})
