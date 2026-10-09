import { describe, expect, it } from 'vitest'
import type { JourneySpan } from '~/types/journey'
import type { MoodEntry } from '~/types/mood'
import { addDays } from '~/utils/date'
import { levelFromScore } from '~/utils/mood'
import { arcY, defaultReviewYear, partialLabel, reviewModel, reviewSubtitle, reviewYears } from './review'

const TZ = 'UTC'
let n = 0
const entry = (day: string, time: string, score: number, note = '', tags: string[] = []): MoodEntry => ({
  id: `e${n++}`, loggedAt: `${day}T${time}:00.000Z`, level: levelFromScore(score), score, note, tags,
})

/** One check-in a day across a month. */
const month = (start: string, days: number, make: (day: string, i: number) => MoodEntry[]) =>
  Array.from({ length: days }, (_, i) => make(addDays(start, i), i)).flat()

describe('years', () => {
  it('lists years with data and picks the last complete one', () => {
    expect(reviewYears('2024-03-04', '2026-10-05')).toEqual([2024, 2025, 2026])
    expect(reviewYears(null, '2026-10-05')).toEqual([2026])
    expect(defaultReviewYear('2024-03-04', '2026-10-05')).toBe(2025)
    expect(defaultReviewYear('2026-02-01', '2026-10-05')).toBe(2026)
  })

  it('names partial years', () => {
    expect(partialLabel(2024, '2024-03-04', '2026-10-05')).toBe('March to December')
    expect(partialLabel(2025, '2024-03-04', '2026-10-05')).toBeNull()
    expect(partialLabel(2026, '2024-03-04', '2026-10-05')).toBe('January to today')
    expect(partialLabel(2026, '2026-03-04', '2026-10-05')).toBe('March to today')
    expect(reviewSubtitle(2026, '2026-10-05', 'January to today')).toBe('Your year so far, January to today.')
    expect(reviewSubtitle(2024, '2026-10-05', 'March to December')).toBe('Your year, March to December.')
    expect(reviewSubtitle(2025, '2026-10-05', null)).toBe('Your year, in your own words.')
  })

  it('maps the arc between 3.25 and 7.75', () => {
    expect([arcY(7.75), arcY(5.5), arcY(2)]).toEqual([0, 0.5, 1])
  })
})

describe('reviewModel', () => {
  // January steady at 5, February good with Gym in the evening, March low and tired in the morning.
  const entries = [
    ...month('2025-01-01', 31, (d, i) => [entry(d, '09:00', 5, i === 3 ? 'Normal day.' : ''), entry(d, '19:00', 5)]),
    ...month('2025-02-01', 28, (d, i) => [entry(d, '09:00', 6), entry(d, '19:00', i % 2 ? 9 : 8, i === 5 ? 'Gym felt great.' : i === 7 ? 'New squat PR.' : '', ['Gym'])]),
    ...month('2025-03-01', 31, (d, i) => [entry(d, '09:00', i % 3 ? 3 : 2, i === 2 ? 'Heavy eyes all morning.' : i === 9 ? 'Running on four hours of sleep.' : '', ['Tired']), entry(d, '19:00', 5)]),
  ]
  const journeys: JourneySpan[] = [
    { id: 'g', name: 'Gym consistency', start: '2025-01-06', end: '2025-03-06', status: 'completed', statusLabel: 'Completed · 60 days' },
    { id: 'd', name: 'Dopamine detox', start: '2024-10-01', end: '2024-10-08', status: 'stopped', statusLabel: 'Stopped at day 8' },
  ]
  const model = reviewModel({ year: 2025, entries, journeys, firstDay: '2024-03-04', today: '2026-10-05', timeZone: TZ })

  it('counts the year and its journeys', () => {
    expect(model.counts).toEqual({ checkIns: 180, notes: 5, journeys: 1, completed: 1 })
    expect(model.partial).toBeNull()
  })

  it('labels months and draws weekly averages', () => {
    expect(model.months.slice(0, 4).map(m => [m.short, m.label, m.tone])).toEqual([
      ['Jan', 'Most stable', 'stable'], ['Feb', 'Best month', 'best'], ['Mar', 'Hardest month', 'hardest'], ['Apr', 'No data', 'plain'],
    ])
    expect(model.months[1]!.days).toHaveLength(28)
    expect(model.weeks[0]).toMatchObject({ start: '2025-01-01', average: 5, entries: 14, x: 3.5 / 365, note: 'Normal day.' })
    expect(model.weeks).toHaveLength(13)
  })

  it('finds the superlatives', () => {
    expect(model.superlatives.map(s => [s.key, s.value, s.to ?? null, s.sub])).toEqual([
      ['Best month', 'February', null, 'Averaged 7.3. #Gym showed up more than usual.'],
      ['Most difficult month', 'March', null, 'Averaged 3.8. #Tired showed up more than usual.'],
      ['Most stable month', 'January', null, 'Days rarely strayed more than 0.0 from the month\'s average.'],
      ['Most common mood', 'Neutral', null, '67% of check-ins. Low came next at 11%.'],
      ['Biggest positive change', 'Jan', 'Feb', 'Average rose 2.3 points, from 5.0 to 7.3.'],
      ['Longest journey', 'Gym consistency', null, '60 days · Completed'],
    ])
  })

  it('keeps the highest and lowest notes, in date order, with their context', () => {
    expect(model.moments.map(m => [m.date, m.score, m.note])).toEqual([
      ['Jan 4', 5, 'Normal day.'],
      ['Feb 6', 9, 'Gym felt great.'],
      ['Feb 8', 9, 'New squat PR.'],
      ['Mar 3', 3, 'Heavy eyes all morning.'],
      ['Mar 10', 2, 'Running on four hours of sleep.'],
    ])
    expect(model.moments[1]!.context).toBe('Thu 19:00 · Gym consistency · Day 32 · #Gym')
  })

  it('compares the most used tags with the average and places journey lanes', () => {
    expect(model.tags.map(t => [t.tag, t.count, t.width])).toEqual([['Tired', 31, 1], ['Gym', 28, 28 / 31]])
    expect(model.tags[1]!.difference).toBeCloseTo(8.5 - model.average!)
    expect(model.lanes).toEqual([{ id: 'g', name: 'Gym consistency', left: 5 / 365, width: 60 / 365, tone: 'completed' }])
    expect(model.journeys[0]).toMatchObject({ dates: '6 Jan – 6 Mar', status: 'Completed · 60 days', tone: 'completed' })
  })

  it('writes a reflection from the numbers', () => {
    expect(model.arcTitle).toBe('A year that asked a lot')
    expect(model.reflection).toEqual([
      'The year ended a little lower than it began: 6.0 in its first two months, 5.4 in its last two. February was the high point, with more #Gym than usual.',
      'March was harder. 31 of its 31 low entries were tagged #Tired, which may be worth looking at, or may just have been that kind of month.',
      'You ran 1 journey and finished 1. Across all 180 check-ins, evenings averaged 6.1 against 4.5 for mornings.',
    ])
  })

  it('handles a year without check-ins', () => {
    const empty = reviewModel({ year: 2026, entries: [], journeys: [], firstDay: null, today: '2026-10-05', timeZone: TZ })
    expect(empty).toMatchObject({ average: null, weeks: [], superlatives: [], moments: [], tags: [], reflection: [], partial: 'January to today' })
    expect(empty.months.every(m => m.label === 'No data')).toBe(true)
  })
})
