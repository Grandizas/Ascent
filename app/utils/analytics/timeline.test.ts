import { describe, expect, it } from 'vitest'
import type { JourneySpan } from '~/types/journey'
import type { MoodEntry } from '~/types/mood'
import { levelFromScore } from '~/utils/mood'
import {
  canGoNewer, canGoOlder, moments, patterns, PATTERNS_FALLBACK, periodFor, periodShortLabel, periodTitle, previousPeriod, timelineStats,
} from './timeline'
import { journeyLanes, journeyMarkers, lineChartModel, monthsBetween, yearHeatmapModel } from './timelineChart'

const TZ = 'UTC'
const TODAY = '2026-10-05'
let n = 0
const entry = (day: string, time: string, score: number, note = '', tags: string[] = []): MoodEntry => ({
  id: `e${n++}`,
  loggedAt: `${day}T${time}:00.000Z`,
  level: levelFromScore(score),
  score,
  note,
  tags,
})

describe('periods', () => {
  it('computes each range relative to today', () => {
    expect(periodFor('day', 1, TODAY, '2024-03-04')).toMatchObject({ start: '2026-10-04', end: '2026-10-04' })
    expect(periodFor('week', 0, TODAY, '2024-03-04')).toMatchObject({ start: '2026-09-29', end: '2026-10-05' })
    expect(periodFor('month', 1, TODAY, '2024-03-04')).toMatchObject({ start: '2026-08-07', end: '2026-09-05' })
    expect(periodFor('year', 2, TODAY, '2024-03-04')).toMatchObject({ start: '2024-01-01', end: '2024-12-31' })
    expect(periodFor('all', 3, TODAY, '2024-03-04')).toMatchObject({ start: '2024-03-04', end: TODAY, offset: 0 })
  })

  it('stops at the first data day and at today', () => {
    const first = '2026-09-20'
    expect(canGoOlder(periodFor('week', 0, TODAY, first), TODAY, first)).toBe(true)
    expect(canGoOlder(periodFor('week', 2, TODAY, first), TODAY, first)).toBe(false)
    expect(canGoOlder(periodFor('all', 0, TODAY, first), TODAY, first)).toBe(false)
    expect(canGoNewer(periodFor('week', 0, TODAY, first))).toBe(false)
    expect(canGoNewer(periodFor('week', 1, TODAY, first))).toBe(true)
    expect(previousPeriod(periodFor('year', 0, TODAY, first), TODAY)).toMatchObject({ start: '2025-01-01' })
  })

  it('labels periods like the design', () => {
    const first = '2024-03-04'
    expect(periodTitle(periodFor('day', 0, TODAY, first), TODAY)).toBe('Mon, 5 October')
    expect(periodTitle(periodFor('week', 0, TODAY, first), TODAY)).toBe('Sep 29 – Oct 5')
    expect(periodTitle(periodFor('year', 0, TODAY, first), TODAY)).toBe('2026')
    expect(periodTitle(periodFor('all', 0, TODAY, first), TODAY)).toBe('Mar 2024 – today')
    expect(periodTitle(periodFor('week', 41, TODAY, first), TODAY)).toBe('Dec 16 2025 – Dec 22 2025')
    expect(periodShortLabel(periodFor('day', 0, TODAY, first), TODAY)).toBe('Today')
    expect(periodShortLabel(periodFor('day', 1, TODAY, first), TODAY)).toBe('Oct 4')
    expect(periodShortLabel(periodFor('month', 1, TODAY, first), TODAY)).toBe('Those 30 days')
  })
})

describe('timelineStats', () => {
  const week = periodFor('week', 0, TODAY, '2024-03-04')

  it('builds the four cells', () => {
    const entries = [
      entry('2026-10-01', '09:00', 4, '', ['Work']),
      entry('2026-10-02', '09:00', 6, '', ['Work', 'Gym']),
      entry('2026-10-03', '09:00', 8, '', ['Gym']),
      entry('2026-10-03', '19:00', 8, '', ['Work']),
    ]
    const previous = [entry('2026-09-25', '10:00', 5)]
    const [avg, checkIns, stability, most] = timelineStats(entries, previous, week, TODAY, TZ)
    expect(avg).toEqual({ key: 'Average', value: '6.5', sub: '↑ 1.5 vs previous', tone: 'positive' })
    expect(checkIns).toMatchObject({ value: '4', sub: '0.6 a day' })
    expect(stability).toMatchObject({ key: 'Stability', value: 'Variable', sub: '±1.6 day to day' })
    expect(most).toMatchObject({ value: 'Work', sub: '3×' })
  })

  it('shows the range for a single day and handles no data', () => {
    const day = periodFor('day', 0, TODAY, '2024-03-04')
    const cells = timelineStats([entry(TODAY, '08:00', 3), entry(TODAY, '18:00', 8)], [], day, TODAY, TZ)
    expect(cells[2]).toMatchObject({ key: 'Range', value: '3–8' })
    expect(cells[1]!.sub).toBe('')
    expect(timelineStats([], null, week, TODAY, TZ)[0]).toMatchObject({ value: '—', sub: '' })
  })
})

describe('moments', () => {
  it('picks noted entries, newest first on ties, without repeating a note', () => {
    const list = [
      entry('2026-10-01', '09:00', 9, 'Great run'),
      entry('2026-10-03', '09:00', 9, 'Great run'),
      entry('2026-10-02', '09:00', 9, 'Dinner with friends'),
      entry('2026-10-02', '12:00', 2, 'Awful meeting'),
      entry('2026-10-02', '13:00', 10),
    ]
    expect(moments(list, 'best').map(e => e.note)).toEqual(['Great run', 'Dinner with friends', 'Awful meeting'])
    expect(moments(list, 'best')[0]!.loggedAt.startsWith('2026-10-03')).toBe(true)
    expect(moments(list, 'lowest')[0]!.note).toBe('Awful meeting')
  })
})

describe('patterns', () => {
  const month = periodFor('month', 0, TODAY, '2024-03-04')

  it('falls back when there is too little data', () => {
    expect(patterns([entry(TODAY, '09:00', 5)], month, TZ)).toEqual([PATTERNS_FALLBACK])
  })

  it('finds time-of-day, tag and low-note patterns', () => {
    const list = [
      entry('2026-10-01', '09:00', 3, 'Tired again', ['Tired']),
      entry('2026-10-02', '10:00', 4, 'Slow start', ['Tired']),
      entry('2026-10-03', '09:30', 3, 'Rough night', ['Work']),
      entry('2026-10-01', '19:00', 8, '', ['Gym']),
      entry('2026-10-02', '20:00', 8, '', ['Gym']),
      entry('2026-10-03', '19:30', 9, '', ['Gym']),
      entry('2026-10-04', '19:30', 8, '', ['Gym']),
    ]
    const found = patterns(list, month, TZ)
    expect(found[0]).toBe('Your mood was generally lowest in the mornings, averaging 3.3, and highest in the evenings at 8.3.')
    expect(found[1]).toMatch(/^Entries tagged Gym averaged 2\.\d points above your period average \(4 entries\)\.$/)
    expect(found[2]).toBe('2 of your 3 lowest noted entries were tagged Tired.')
  })
})

describe('chart models', () => {
  it('places week points inside their day column', () => {
    const week = periodFor('week', 0, TODAY, '2024-03-04')
    const model = lineChartModel([entry('2026-09-29', '15:00', 5), entry(TODAY, '15:00', 7)], week, TZ)
    expect(model.points[0]!.x).toBeCloseTo(0.5 / 7)
    expect(model.points[1]!.x).toBeCloseTo(6.5 / 7)
    expect(model.ticks[0]!.label).toBe('Tue 29')
    expect(model.dividers).toHaveLength(6)
  })

  it('puts each week day average where its check-ins are, not mid-column', () => {
    const week = periodFor('week', 0, TODAY, '2024-03-04')
    // One evening check-in on Sunday; two on Monday (morning and evening).
    const model = lineChartModel([entry('2026-10-04', '20:30', 2), entry(TODAY, '09:00', 5), entry(TODAY, '21:00', 7)], week, TZ)
    expect(model.line[0]!.x).toBeCloseTo(model.points[0]!.x) // single check-in: vertex on the dot
    expect(model.line[1]!.x).toBeCloseTo((model.points[1]!.x + model.points[2]!.x) / 2)
    expect(model.line[1]!.v).toBe(6)
  })

  it('draws a min/max band for 30 days only with 7+ days of data', () => {
    const month = periodFor('month', 0, TODAY, '2024-03-04')
    const few = Array.from({ length: 6 }, (_, i) => entry(`2026-09-${String(20 + i)}`, '10:00', 5))
    expect(lineChartModel(few, month, TZ).band).toEqual([])
    const many = Array.from({ length: 8 }, (_, i) => entry(`2026-09-${String(20 + i)}`, '10:00', 5))
    expect(lineChartModel(many, month, TZ).band).toHaveLength(8)
  })

  it('lists months and labels all-time by first month and Januaries', () => {
    expect(monthsBetween('2025-11-15', '2026-02-01')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
    const all = periodFor('all', 0, TODAY, '2025-11-15')
    const model = lineChartModel([entry('2025-11-20', '10:00', 6)], all, TZ)
    expect(model.ticks.map(t => t.label)).toEqual(['Nov 2025', '2026'])
  })

  it('lays out the year heatmap Monday-first', () => {
    const model = yearHeatmapModel([entry('2026-01-05', '10:00', 7)], 2026, TODAY, TZ)
    // 1 Jan 2026 is a Thursday: three empty leading cells.
    expect(model.cells.slice(0, 3).every(c => c.day === null)).toBe(true)
    expect(model.cells[3]!.day).toBe('2026-01-01')
    expect(model.cells.find(c => c.day === '2026-01-05')!.color).toMatch(/^oklch/)
    expect(model.cells.find(c => c.day === TODAY)!.isToday).toBe(true)
    expect(model.months[0]).toEqual({ label: 'Jan', column: 0 })
    expect(model.cells).toHaveLength(3 + 365)
    expect(model.columns).toBe(53)
  })

  it('clips journey lanes to the period and marks starts', () => {
    const journeys: JourneySpan[] = [
      { id: 'a', name: 'Nicotine-free · #2', start: '2026-09-24', end: null, status: 'active', statusLabel: 'Day 12 · active' },
      { id: 'b', name: 'Old one', start: '2025-01-01', end: '2025-02-01', status: 'completed', statusLabel: 'Completed' },
    ]
    const month = periodFor('month', 0, TODAY, '2024-03-04')
    const lanes = journeyLanes(journeys, month, TODAY)
    expect(lanes).toHaveLength(1)
    expect(lanes[0]!.left).toBeCloseTo(18 / 30)
    expect(lanes[0]!.width).toBeCloseTo(12 / 30)
    expect(journeyMarkers(journeys, month)).toEqual([{ id: 'a', label: 'Nicotine-free started', x: 18 / 30 }])
  })
})

describe('point labels', () => {
  it('carry the tooltip content for day averages', () => {
    const month = periodFor('month', 0, TODAY, '2024-03-04')
    const model = lineChartModel([entry('2026-10-01', '09:00', 3, 'Rough start.'), entry('2026-10-01', '19:00', 8)], month, TZ)
    expect(model.points[0]!.label).toBe('Thu Oct 1, avg 5.5. 09:00 — “Rough start.” 2 check-ins · range 3–8.')
  })
})
