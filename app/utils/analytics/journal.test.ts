import { describe, expect, it } from 'vitest'
import type { FeedDay, JournalMonth } from '~/types/journal'
import type { JourneySpan } from '~/types/journey'
import type { MoodEntry } from '~/types/mood'
import { levelFromScore } from '~/utils/mood'
import {
  feedDays, type FeedRow, filtersFromQuery, filtersToQuery, filterSummary, formatWordCount, journalBlocks, journalEyebrow,
  journeyChips, journeyEvents, NO_FILTERS, onThisDay, onThisDayDates, wordCount,
} from './journal'

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

const JOURNEYS: JourneySpan[] = [
  { id: 'n1', name: 'Nicotine-free · #1', start: '2026-08-14', end: '2026-08-17', status: 'setback', statusLabel: '4 days · setback' },
  { id: 'n2', name: 'Nicotine-free · #2', start: '2026-09-24', end: null, status: 'active', statusLabel: 'Day 12 · active' },
  { id: 'gym', name: 'Gym consistency', start: '2025-01-06', end: '2025-03-06', status: 'completed', statusLabel: 'Completed · 60 days' },
]

describe('filters', () => {
  it('round-trips through the URL and ignores unknown values', () => {
    const filters = { query: 'run', tag: 'Gym', level: 4 as const, notesOnly: false }
    expect(filtersToQuery(filters)).toEqual({ q: 'run', tag: 'Gym', mood: 'good', all: '1' })
    expect(filtersFromQuery(filtersToQuery(filters))).toEqual(filters)
    expect(filtersFromQuery({ mood: 'ecstatic', all: '0' })).toEqual(NO_FILTERS)
    expect(filtersToQuery(NO_FILTERS)).toEqual({ q: undefined, tag: undefined, mood: undefined, all: undefined })
  })

  it('describes the active filters like the design', () => {
    expect(filterSummary({ query: ' run ', tag: 'Gym', level: 4, notesOnly: true })).toBe('Showing notes matching “run” · #Gym · Good')
    expect(filterSummary({ ...NO_FILTERS, notesOnly: false })).toBe('')
  })
})

describe('composer', () => {
  it('counts words', () => {
    expect(wordCount('  ')).toBe(0)
    expect(formatWordCount(wordCount('Ten days in.\n\nFine.'))).toBe('4 words')
    expect(formatWordCount(1)).toBe('1 word')
    expect(formatWordCount(0)).toBe('')
  })
})

describe('feedDays', () => {
  it('groups rows by their local day, newest day first', () => {
    const rows: FeedRow[] = [
      { kind: 'long', id: 'l1', at: '2026-10-03T20:00:00+00:00', day: '2026-10-03', level: null, score: null, body: 'Long text', tags: [], matches: true },
      { kind: 'check-in', id: 'c1', at: '2026-10-04T23:30:00+00:00', day: '2026-10-05', level: 3, score: 5, body: '', tags: ['Work'], matches: false },
      { kind: 'check-in', id: 'c2', at: '2026-10-05T08:00:00+00:00', day: '2026-10-05', level: 4, score: 7, body: 'Gym', tags: [], matches: true },
    ]
    const days = feedDays(rows)
    expect(days.map(d => d.day)).toEqual(['2026-10-05', '2026-10-03'])
    expect(days[0]!.items.map(i => i.entry.id)).toEqual(['c1', 'c2'])
    expect(days[0]!.items[0]).toMatchObject({ kind: 'check-in', matches: false, entry: { loggedAt: '2026-10-04T23:30:00.000Z', note: '', level: 3 } })
    expect(days[1]!.items[0]).toEqual({ kind: 'long', matches: true, entry: { id: 'l1', writtenAt: '2026-10-03T20:00:00.000Z', body: 'Long text' } })
  })
})

describe('journeys', () => {
  it('lists starts, floors reached and endings', () => {
    const events = journeyEvents(JOURNEYS, TODAY)
    const n2 = events.filter(e => e.id.startsWith('n2'))
    expect(n2.map(e => [e.day, e.text, e.sub])).toEqual([
      ['2026-09-24', 'Journey started: Nicotine-free', 'Attempt 2'],
      ['2026-09-26', 'Reached Day 3: Nicotine-free', 'the second floor'],
      ['2026-09-30', 'Reached Day 7: Nicotine-free', 'the third floor'],
    ])
    expect(events.find(e => e.id === 'n1:end')).toMatchObject({ day: '2026-08-17', text: 'Setback recorded: Nicotine-free', tone: 'ended' })
    // Day 60 falls on the last day: told by the completion, not as a floor.
    const gym = events.filter(e => e.id.startsWith('gym'))
    expect(gym.map(e => e.text).at(-2)).toBe('Reached Day 30: Gym consistency')
    expect(gym.at(-1)).toMatchObject({ text: 'Journey completed: Gym consistency', sub: 'Completed · 60 days', tone: 'completed' })
  })

  it('labels the journeys running on a day', () => {
    expect(journeyChips(JOURNEYS, '2026-08-16', TODAY)).toEqual([{ id: 'n1', label: 'Nicotine-free #1 · Day 3', active: false }])
    expect(journeyChips(JOURNEYS, TODAY, TODAY)).toEqual([{ id: 'n2', label: 'Nicotine-free · Day 12', active: true }])
  })
})

describe('journalBlocks', () => {
  const months: JournalMonth[] = [
    { month: '2026-09', entries: 120, notes: 61, average: 5.43 },
    { month: '2026-10', entries: 30, notes: 1, average: 6 },
  ]
  const morning = entry(TODAY, '08:00', 4, 'Slow start', ['Tired'])
  const quiet = entry(TODAY, '12:00', 6)
  const long = { id: 'l1', writtenAt: '2026-10-05T07:00:00.000Z', body: 'Long text' }
  const days: FeedDay[] = [
    { day: TODAY, items: [
      { kind: 'long', entry: long, matches: true },
      { kind: 'check-in', entry: morning, matches: true },
      { kind: 'check-in', entry: quiet, matches: false },
    ] },
    { day: '2026-10-04', items: [{ kind: 'check-in', entry: entry('2026-10-04', '09:00', 8, 'Good'), matches: true }] },
    { day: '2026-09-30', items: [{ kind: 'check-in', entry: entry('2026-09-30', '09:00', 3, 'Low'), matches: true }] },
  ]

  it('builds the rail, month headers and items', () => {
    const blocks = journalBlocks(days, { filters: NO_FILTERS, today: TODAY, months, journeys: JOURNEYS })
    expect(blocks.map(b => [b.weekday, b.date])).toEqual([['Today', '5 Oct'], ['Yesterday', '4 Oct'], ['Wed', '30 Sep']])
    expect(blocks[0]!.month).toEqual({ label: 'October 2026', summary: '1 note · avg 6.0' })
    expect(blocks[1]!.month).toBeNull()
    expect(blocks[2]!.month).toEqual({ label: 'September 2026', summary: '61 notes · avg 5.4' })
    // The rail counts every check-in; the list shows only the matching ones.
    expect(blocks[0]!.summary).toBe('2 check-ins · avg 5.0')
    expect(blocks[0]!.checkIns).toHaveLength(2)
    expect(blocks[0]!.items.map(i => i.key)).toEqual(['l1', morning.id])
    expect(blocks[0]!.chips).toEqual([{ id: 'n2', label: 'Nicotine-free · Day 12', active: true }])
    expect(blocks[2]!.items[0]).toMatchObject({ kind: 'event', event: { text: 'Reached Day 7: Nicotine-free' } })
  })

  it('hides journey events and month totals while filtering', () => {
    const blocks = journalBlocks(days, { filters: { ...NO_FILTERS, tag: 'Tired' }, today: TODAY, months, journeys: JOURNEYS })
    expect(blocks[0]!.month).toEqual({ label: 'October 2026', summary: '' })
    expect(blocks[2]!.items.every(i => i.kind !== 'event')).toBe(true)
  })

  it('leaves the summary empty for a day with only a longer entry', () => {
    const [block] = journalBlocks([{ day: TODAY, items: [{ kind: 'long', entry: long, matches: true }] }], { filters: NO_FILTERS, today: TODAY, months: [], journeys: [] })
    expect(block!.summary).toBe('')
    expect(block!.month!.summary).toBe('')
  })
})

describe('header and memories', () => {
  it('counts notes since the first month', () => {
    expect(journalEyebrow([{ month: '2024-03', entries: 40, notes: 20, average: 5 }, { month: '2024-04', entries: 900, notes: 1264, average: 5 }])).toBe('Journal · 1,284 notes since Mar 2024')
    expect(journalEyebrow([])).toBe('Journal')
  })

  it('picks the most telling noted check-in from the same date in past years', () => {
    expect(onThisDayDates(TODAY)).toEqual(['2025-10-05', '2024-10-05'])
    expect(onThisDayDates('2028-02-29')).toEqual([])
    const entries = [
      entry('2025-10-05', '08:00', 5, 'Normal morning'),
      entry('2025-10-05', '13:00', 9, 'Great lunch'),
      entry('2025-10-05', '20:00', 5),
      entry('2024-10-05', '10:00', 6),
    ]
    const memories = onThisDay(entries, onThisDayDates(TODAY), 'UTC')
    expect(memories).toHaveLength(1)
    expect(memories[0]).toMatchObject({ year: 2025, entry: { note: 'Great lunch' } })
  })
})
