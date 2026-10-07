// Journal feed: filters, day blocks, journey events and "On this day".
// Pure functions; the page loads data and components only draw.

import type { FeedDay, FeedItem, JournalFilters, JournalMonth, LongEntry } from '~/types/journal'
import type { JourneySpan } from '~/types/journey'
import type { MoodEntry } from '~/types/mood'
import { addDays, type DayKey, dayKey, daysBetween, daysInMonth, formatDayKey, monthShort } from '~/utils/date'
import { CHECKPOINT_DAYS, floorName, journeyAttempt, journeyBaseName } from '~/utils/journey'
import { getMood, type MoodLevel, MOODS } from '~/utils/mood'

/** Days shown per page ("Show earlier days" loads the next page). */
export const JOURNAL_PAGE_DAYS = 8

export const NO_FILTERS: Readonly<JournalFilters> = { query: '', tag: null, level: null, notesOnly: true }

/** True when a search, tag or mood narrows the feed (the notes/every toggle doesn't count). */
export function isFiltering(filters: JournalFilters): boolean {
  return filters.query.trim() !== '' || filters.tag !== null || filters.level !== null
}

/** "Showing notes matching “run” · #Gym · Good", or '' without filters. */
export function filterSummary(filters: JournalFilters): string {
  const query = filters.query.trim()
  const parts = [query && `“${query}”`, filters.tag && `#${filters.tag}`, filters.level && getMood(filters.level).label].filter(Boolean)
  return parts.length ? `Showing notes matching ${parts.join(' · ')}` : ''
}

// ── URL ───────────────────────────────────────────────────────────────
type QueryValue = string | null | undefined | (string | null)[]
const first = (value: QueryValue) => (Array.isArray(value) ? value[0] : value) ?? undefined

/** Filters from the route query (`?q=run&tag=Gym&mood=good&all=1`). Unknown values are ignored. */
export function filtersFromQuery(query: Record<string, QueryValue>): JournalFilters {
  const mood = first(query.mood)?.toLowerCase()
  return {
    query: first(query.q) ?? '',
    tag: first(query.tag) || null,
    level: MOODS.find(m => m.label.toLowerCase() === mood)?.level ?? null,
    notesOnly: first(query.all) !== '1',
  }
}

/** The route query for `filters`; defaults are left out. */
export function filtersToQuery(filters: JournalFilters): Record<string, string | undefined> {
  return {
    q: filters.query.trim() || undefined,
    tag: filters.tag ?? undefined,
    mood: filters.level ? getMood(filters.level).label.toLowerCase() : undefined,
    all: filters.notesOnly ? undefined : '1',
  }
}

// ── Composer ──────────────────────────────────────────────────────────
export function wordCount(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

/** "1 word", "12 words", or '' for none. */
export function formatWordCount(count: number): string {
  return count ? `${count} word${count === 1 ? '' : 's'}` : ''
}

// ── Feed rows ─────────────────────────────────────────────────────────
/** A row of the `journal_feed` function. */
export interface FeedRow {
  kind: string
  id: string
  at: string
  day: string
  level: number | null
  score: number | null
  body: string
  tags: string[]
  matches: boolean
}

function toItem(row: FeedRow): FeedItem {
  const at = new Date(row.at).toISOString()
  if (row.kind === 'long') return { kind: 'long', matches: row.matches, entry: { id: row.id, writtenAt: at, body: row.body } }
  return {
    kind: 'check-in',
    matches: row.matches,
    entry: { id: row.id, loggedAt: at, level: row.level as MoodLevel, score: row.score ?? 0, note: row.body, tags: row.tags },
  }
}

/** Groups feed rows (oldest first) into days, newest day first. */
export function feedDays(rows: readonly FeedRow[]): FeedDay[] {
  const byDay = new Map<DayKey, FeedItem[]>()
  for (const row of rows) {
    const items = byDay.get(row.day) ?? []
    items.push(toItem(row))
    byDay.set(row.day, items)
  }
  return [...byDay].map(([day, items]) => ({ day, items })).sort((a, b) => (a.day < b.day ? 1 : -1))
}

// ── Journeys ──────────────────────────────────────────────────────────
/**
 * start — sage diamond · milestone — amber diamond ·
 * completed — light diamond · ended — dim diamond (setback or pause).
 */
export type JourneyEventTone = 'start' | 'milestone' | 'completed' | 'ended'

export interface JourneyEvent {
  id: string
  day: DayKey
  text: string
  sub: string
  tone: JourneyEventTone
}

/** Starts, floors reached and endings of every journey, up to today. */
export function journeyEvents(journeys: readonly JourneySpan[], today: DayKey): JourneyEvent[] {
  return journeys.flatMap((j) => {
    const name = journeyBaseName(j.name)
    const attempt = journeyAttempt(j.name)
    const events: JourneyEvent[] = [
      { id: `${j.id}:start`, day: j.start, text: `Journey started: ${name}`, sub: attempt ? `Attempt ${attempt}` : '', tone: 'start' },
    ]
    CHECKPOINT_DAYS.forEach((checkpoint, index) => {
      const day = addDays(j.start, checkpoint - 1)
      // Day 1 is the start itself; a floor reached on the last day is told by the ending.
      if (index === 0 || day > today || (j.end !== null && day >= j.end)) return
      events.push({ id: `${j.id}:day-${checkpoint}`, day, text: `Reached Day ${checkpoint}: ${name}`, sub: floorName(index), tone: 'milestone' })
    })
    if (j.end !== null) {
      const text = j.status === 'setback'
        ? `Setback recorded: ${name}`
        : j.status === 'stopped' ? `Journey paused: ${name}` : `Journey completed: ${name}`
      events.push({ id: `${j.id}:end`, day: j.end, text, sub: j.statusLabel, tone: j.status === 'completed' ? 'completed' : 'ended' })
    }
    return events
  })
}

export interface JourneyChip {
  id: string
  /** "Nicotine-free · Day 12"; earlier attempts keep their number ("Nicotine-free #1 · Day 3"). */
  label: string
  active: boolean
}

/** Journeys running on `day`, with the day number each had reached. */
export function journeyChips(journeys: readonly JourneySpan[], day: DayKey, today: DayKey): JourneyChip[] {
  return journeys
    .filter(j => j.start <= day && day <= (j.end ?? today))
    .map((j) => {
      const active = j.end === null
      const attempt = journeyAttempt(j.name)
      const name = !active && attempt ? `${journeyBaseName(j.name)} #${attempt}` : journeyBaseName(j.name)
      return { id: j.id, label: `${name} · Day ${daysBetween(j.start, day) + 1}`, active }
    })
}

// ── Day blocks ────────────────────────────────────────────────────────
export type BlockItem
  = | { kind: 'event', key: string, event: JourneyEvent }
    | { kind: 'check-in', key: string, entry: MoodEntry }
    | { kind: 'long', key: string, entry: LongEntry }

export interface JournalBlock {
  day: DayKey
  /** Month header shown above the first day of each month. */
  month: { label: string, summary: string } | null
  /** "Today", "Yesterday" or "Mon" (shown uppercase). */
  weekday: string
  /** "5 Oct". */
  date: string
  /** Every check-in of the day, for the rail bars, whatever the filters. */
  checkIns: MoodEntry[]
  /** "6 check-ins · avg 5.3". */
  summary: string
  chips: JourneyChip[]
  /** Journey events first, then the matching entries in time order. */
  items: BlockItem[]
}

export interface BlockContext {
  filters: JournalFilters
  today: DayKey
  months: readonly JournalMonth[]
  journeys: readonly JourneySpan[]
}

const plural = (count: number, word: string) => `${count.toLocaleString('en-GB')} ${word}${count === 1 ? '' : 's'}`

function monthSummary(month: JournalMonth | undefined): string {
  return month?.entries ? `${plural(month.notes, 'note')} · avg ${month.average.toFixed(1)}` : ''
}

function weekdayLabel(day: DayKey, today: DayKey): string {
  if (day === today) return 'Today'
  if (day === addDays(today, -1)) return 'Yesterday'
  return formatDayKey(day, { weekday: 'short' })
}

export function journalBlocks(days: readonly FeedDay[], context: BlockContext): JournalBlock[] {
  const filtering = isFiltering(context.filters)
  const months = new Map(context.months.map(m => [m.month, m]))
  const events = filtering ? [] : journeyEvents(context.journeys, context.today)
  let previousMonth = ''

  return days.map(({ day, items }) => {
    const month = day.slice(0, 7)
    const header = month === previousMonth
      ? null
      : { label: formatDayKey(`${month}-01`, { month: 'long', year: 'numeric' }), summary: filtering ? '' : monthSummary(months.get(month)) }
    previousMonth = month

    const checkIns = items.flatMap(i => (i.kind === 'check-in' ? [i.entry] : []))
    const average = checkIns.reduce((sum, e) => sum + e.score, 0) / checkIns.length

    return {
      day,
      month: header,
      weekday: weekdayLabel(day, context.today),
      date: `${Number(day.slice(8, 10))} ${monthShort(Number(day.slice(5, 7)))}`,
      checkIns,
      summary: checkIns.length ? `${plural(checkIns.length, 'check-in')} · avg ${average.toFixed(1)}` : '',
      chips: journeyChips(context.journeys, day, context.today),
      items: [
        ...events.filter(e => e.day === day).map(event => ({ kind: 'event' as const, key: event.id, event })),
        ...items.filter(i => i.matches).map(i => ({ ...i, key: i.entry.id })),
      ],
    }
  })
}

/** "Journal · 1,284 notes since Mar 2024" (check-in notes), or "Journal" before the first check-in. */
export function journalEyebrow(months: readonly JournalMonth[]): string {
  const first = months.find(m => m.entries > 0)
  if (!first) return 'Journal'
  const notes = months.reduce((sum, m) => sum + m.notes, 0)
  return `Journal · ${plural(notes, 'note')} since ${monthShort(Number(first.month.slice(5, 7)))} ${first.month.slice(0, 4)}`
}

// ── On this day ───────────────────────────────────────────────────────
/** The same date `years` ago, oldest last; skipped when it doesn't exist (29 Feb). */
export function onThisDayDates(today: DayKey, years: readonly number[] = [1, 2]): DayKey[] {
  const [y, m, d] = today.split('-').map(Number) as [number, number, number]
  return years
    .filter(k => d <= daysInMonth(y - k, m))
    .map(k => `${y - k}-${today.slice(5)}`)
}

export interface Memory {
  year: number
  entry: MoodEntry
}

/**
 * One noted check-in for each of `days`: the one furthest from that day's
 * average, i.e. the most telling of how the day went.
 */
export function onThisDay(entries: readonly MoodEntry[], days: readonly DayKey[], timeZone: string): Memory[] {
  return days.flatMap((day) => {
    const ofDay = entries.filter(e => dayKey(e.loggedAt, timeZone) === day)
    if (!ofDay.length) return []
    const average = ofDay.reduce((sum, e) => sum + e.score, 0) / ofDay.length
    const noted = ofDay.filter(e => e.note)
    const best = noted.reduce<MoodEntry | null>((pick, e) => (!pick || Math.abs(e.score - average) > Math.abs(pick.score - average) ? e : pick), null)
    return best ? [{ year: Number(day.slice(0, 4)), entry: best }] : []
  })
}
