import { describe, expect, it } from 'vitest'
import type { Journey, JourneyAttempt } from '~/types/journey'
import type { MoodEntry } from '~/types/mood'
import { levelFromScore } from '~/utils/mood'
import {
  attemptView, climb, evidence, headerMeta, journeyChart, journeyNotes, lowestStretch, moodSummary, nextFloor, phases, shortCountdown, whyLabel,
} from './journeyDetail'

const TZ = 'UTC'
const NOW = Date.parse('2026-10-05T20:43:00Z')
const START = '2026-09-24T10:00:00Z'
const DAY = 86_400_000

const attempt = (id: string, number: number, startedAt: string, endedAt: string | null = null, endReason: JourneyAttempt['endReason'] = null): JourneyAttempt =>
  ({ id, number, startedAt, endedAt, endReason, setbacks: [] })

const NICOTINE: Journey = {
  id: 'nic', name: 'Nicotine-free', what: '', why: 'Baseline.', whyWrittenAt: '2026-08-14T09:00:00Z', lengthDays: 90,
  checkpoints: [1, 3, 7, 14, 30, 60, 90], color: 'amber', createdAt: '2026-08-14T09:00:00Z',
  rules: [{ kind: 'remove', label: 'Nicotine', suggested: false }, { kind: 'remove', label: 'TikTok', suggested: false }],
  attempts: [attempt('a1', 1, '2026-08-14T10:00:00Z', '2026-08-17T18:00:00Z', 'setback'), attempt('a2', 2, START)],
}

let n = 0
/** A check-in `hours` after the start of journey day `day`. */
const on = (day: number, hours: number, score: number, note = '', tags: string[] = []): MoodEntry => ({
  id: `e${n++}`, loggedAt: new Date(Date.parse(START) + (day - 1) * DAY + hours * 3_600_000).toISOString(),
  level: levelFromScore(score), score, note, tags,
})
const before = (daysAgo: number, score: number): MoodEntry => ({
  id: `b${n++}`, loggedAt: new Date(Date.parse(START) - daysAgo * DAY).toISOString(), level: levelFromScore(score), score, note: '', tags: [],
})

const view = attemptView(NICOTINE, NICOTINE.attempts[1]!, NOW)

describe('where the attempt stands', () => {
  it('finds the day and the floors around it', () => {
    expect(view).toMatchObject({ active: true, day: 12, current: 2, next: 3 })
    expect(headerMeta(view, TZ)).toBe('Attempt 2 · Started 24 Sep, 10:00 · Previous attempt: 4 days')
    expect(whyLabel(NICOTINE, TZ)).toBe('Written 14 Aug, before Day 1')
    expect(shortCountdown(5 * 3_600_000 + 12 * 60_000)).toBe('in 5h 12m')
  })

  it('describes an ended attempt', () => {
    const ended = attemptView(NICOTINE, NICOTINE.attempts[0]!, NOW)
    expect(ended).toMatchObject({ active: false, day: 4, current: 1, next: null })
    expect(headerMeta(ended, TZ)).toBe('Attempt 1 · Started 14 Aug, 10:00 · Ended on Day 4 after a setback')
    expect(nextFloor(ended)).toBeNull()
  })
})

describe('climb', () => {
  it('stacks floors ahead, the next floor and tube, the current floor and floors behind', () => {
    const { steps, tube } = climb(view, TZ)
    expect(steps.map(s => [s.label, s.kind, s.note, s.opacity, s.pill, s.tube])).toEqual([
      ['DAY 60', 'future', 'Opens 22 Nov', 0.22, true, false],
      ['DAY 30', 'future', 'Opens 23 Oct', 0.45, true, false],
      ['DAY 14', 'next', 'Opens 7 Oct · in 1d 13h', 1, false, true],
      ['DAY 7', 'current', 'Reached 30 Sep', 1, true, false],
      ['DAY 3', 'past', 'Reached 26 Sep', 0.85, true, false],
      ['Day 1', 'past', 'Started 24 Sep', 0.6, false, false],
    ])
    expect(steps[0]!.blur).toBe(0.6)
    expect(tube!.progress).toBeCloseTo((274.7167 - 144) / 168, 3)
    expect(tube!.ticks.map(t => t.label)).toEqual(['8', '9', '10', 'Day 11', 'Day 12'])
    expect(tube!.ticks[0]!.bottom).toBeCloseTo(1 / 7)
  })

  it('shows the summit as the top floor once reached', () => {
    const steps = climb(attemptView({ ...NICOTINE, checkpoints: [1, 30], lengthDays: 30 }, attempt('x', 1, '2026-09-06T00:00:00Z'), NOW), TZ).steps
    expect(steps.map(s => s.label)).toEqual(['SUMMIT', 'Day 1'])
  })
})

describe('next floor and evidence', () => {
  const during = [
    ...[1, 2, 3, 4, 5, 6, 7].flatMap(d => [on(d, 2, 4, '', ['Nicotine craving']), on(d, 6, 4, '', ['Nicotine craving'])]),
    on(9, 1, 6, '', ['Nicotine craving']), on(10, 1, 6, '', ['Good sleep']), on(11, 1, 7, '', ['Good sleep']),
  ]

  it('repeats the wizard copy for the next floor', () => {
    expect(nextFloor(view)).toEqual({ day: 14, countdown: 'in 1d 13h', expectation: 'Cravings may become less frequent, though sudden urges can still happen.' })
  })

  it('compares cravings, focus and sleep with the user’s own entries', () => {
    const rows = evidence(view, during, [], TZ)
    expect(rows.map(r => r.topic)).toEqual(['Cravings', 'Focus', 'Sleep'])
    expect(rows[0]!.yours).toBe('About 0.7 a day this week, down from 2.0 in week one')
    expect(rows[2]!.yours).toBe('“Good sleep” tagged on 2 of the last 7 nights')
  })

  it('finds the lowest three-hour stretch', () => {
    const entries = [on(1, 0, 3), on(2, 0, 3), on(3, 0, 4), on(1, 8, 7), on(2, 8, 8), on(3, 8, 7)] // 10:00 vs 18:00
    expect(lowestStretch(entries, TZ)).toBe('Mornings are your lowest stretch, 09:00–12:00')
    expect(lowestStretch(entries.slice(0, 2), TZ)).toBeNull()
  })

  it('uses mood and time of day for other journeys', () => {
    const sleep = attemptView({ ...NICOTINE, rules: [{ kind: 'remove', label: 'Screens after 23:00', suggested: false }] }, NICOTINE.attempts[1]!, NOW)
    const rows = evidence(sleep, [on(1, 1, 6), on(2, 1, 6), on(3, 1, 7)], [before(3, 5), before(2, 5), before(1, 5)], TZ)
    expect(rows.map(r => r.topic)).toEqual(['Mood', 'Time of day', 'Sleep'])
    expect(rows[0]!.yours).toBe('Averaging 6.3 since Day 1, against 5.0 before')
  })
})

describe('mood chart', () => {
  const daily = [4.9, 3.6, 4.4, 4.8, 5.0, 5.4, 5.5, 5.7, 6.0, 6.2, 6.4, 6.3]
  const during = daily.flatMap((v, i) => [on(i + 1, 1, Math.floor(v)), on(i + 1, 2, Math.ceil(v))])
  const baseline = [before(5, 6), before(4, 6), before(3, 6), before(2, 5)]
  const chart = journeyChart(view, during, baseline)

  it('plots daily averages up to the next floor with the baseline', () => {
    expect(chart.points).toHaveLength(12)
    expect(chart.points[0]).toMatchObject({ day: 1, x: 1 / 14, latest: false })
    expect(chart.points.at(-1)).toMatchObject({ day: 12, latest: true })
    expect(chart.baseline).toBe(5.75)
    expect(chart.guides).toEqual([3 / 14, 7 / 14])
    // Day 14 sits too close to today's label to be shown, as in the design.
    expect(chart.marks.map(m => m.label)).toEqual(['Day 1', 'Day 3', 'Day 7', 'Day 12'])
  })

  it('summarises the lowest day and the stretch above the baseline', () => {
    expect(moodSummary(chart)).toBe('Your lowest day was Day 2. Since Day 9 your daily average has stayed above where you were before you started.')
  })

  it('splits the attempt into stretches between floors', () => {
    expect(phases(view, during, baseline).map(p => [p.label, p.tone])).toEqual([
      ['Before', 'before'], ['Days 1–3', 'past'], ['Days 4–7', 'past'], ['Days 8–12', 'current'],
    ])
  })
})

describe('notes', () => {
  it('prefers notes about the journey, one per day', () => {
    const during = [
      on(2, 1, 2, 'Can’t concentrate. Keep thinking about buying nicotine.'), on(2, 3, 5, 'Lunch was fine.'),
      on(5, 1, 4, 'Craving after lunch was brutal.', ['Nicotine craving']),
      on(6, 1, 9, 'Great day at the lake.'),
      on(7, 1, 5, 'Deleted TikTok again.'),
    ]
    expect(journeyNotes(view, during).map(note => [note.day, note.text])).toEqual([
      [2, 'Can’t concentrate. Keep thinking about buying nicotine.'],
      [5, 'Craving after lunch was brutal.'],
      [7, 'Deleted TikTok again.'],
    ])
    expect(journeyNotes(view, during.slice(3)).map(note => note.day)).toEqual([6, 7])
  })
})
