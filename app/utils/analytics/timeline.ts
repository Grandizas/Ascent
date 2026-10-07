// Timeline: periods, the stats strip, best/lowest moments and text patterns.
// Pure functions over entries; ported from the design's Timeline logic.

import type { MoodEntry } from '~/types/mood'
import { addDays, type DayKey, dayKey, daysBetween, formatDayKey, formatMonthDay, formatMonthYear, minuteOfDay } from '~/utils/date'
import { formatAverage, formatRange, summarizeScores } from './stats'

export type TimelineRange = 'day' | 'week' | 'month' | 'year' | 'all'

export const TIMELINE_RANGES: readonly { value: TimelineRange, label: string, shortcut: string }[] = [
  { value: 'day', label: 'Day', shortcut: 'D' },
  { value: 'week', label: 'Week', shortcut: 'W' },
  { value: 'month', label: '30 days', shortcut: 'M' },
  { value: 'year', label: 'Year', shortcut: 'Y' },
  { value: 'all', label: 'All time', shortcut: 'A' },
]

export interface Period {
  range: TimelineRange
  offset: number
  /** Inclusive calendar days in the user's timezone. */
  start: DayKey
  end: DayKey
}

/**
 * The period `offset` steps back from today: one day, a 7- or 30-day window
 * ending today, a calendar year, or everything since `firstDay`.
 */
export function periodFor(range: TimelineRange, offset: number, today: DayKey, firstDay: DayKey): Period {
  switch (range) {
    case 'day': {
      const day = addDays(today, -offset)
      return { range, offset, start: day, end: day }
    }
    case 'week':
    case 'month': {
      const length = range === 'week' ? 7 : 30
      const end = addDays(today, -length * offset)
      return { range, offset, start: addDays(end, -(length - 1)), end }
    }
    case 'year': {
      const year = Number(today.slice(0, 4)) - offset
      return { range, offset, start: `${year}-01-01`, end: `${year}-12-31` }
    }
    case 'all':
      return { range, offset: 0, start: firstDay < today ? firstDay : today, end: today }
  }
}

/** The equal-length period just before, for "vs previous"; none for all time. */
export function previousPeriod(period: Period, today: DayKey): Period | null {
  return period.range === 'all' ? null : periodFor(period.range, period.offset + 1, today, today)
}

export function canGoOlder(period: Period, today: DayKey, firstDay: DayKey): boolean {
  const previous = previousPeriod(period, today)
  return !!previous && previous.end >= firstDay
}

export function canGoNewer(period: Period): boolean {
  return period.range !== 'all' && period.offset > 0
}

/** Days of the period that have happened (up to today). */
export function elapsedDays(period: Period, today: DayKey): number {
  const end = period.end < today ? period.end : today
  return Math.max(0, daysBetween(period.start, end) + 1)
}

const withYear = (key: DayKey, today: DayKey) =>
  key.slice(0, 4) === today.slice(0, 4) ? formatMonthDay(key) : `${formatMonthDay(key)} ${key.slice(0, 4)}`

/** Page title: "Mon, 5 October", "Sep 29 – Oct 5", "2026", "Mar 2024 – today". */
export function periodTitle(period: Period, today: DayKey): string {
  switch (period.range) {
    case 'day':
      return `${formatDayKey(period.start, { weekday: 'short' })}, ${formatDayKey(period.start, { day: 'numeric', month: 'long' })}`
    case 'week':
    case 'month':
      return `${withYear(period.start, today)} – ${withYear(period.end, today)}`
    case 'year':
      return period.start.slice(0, 4)
    case 'all':
      return `${formatMonthYear(period.start)} – today`
  }
}

/** Short name used next to "Best moments": "Today", "Last 7 days", "That week"… */
export function periodShortLabel(period: Period, today: DayKey): string {
  const current = period.offset === 0
  switch (period.range) {
    case 'day': return period.start === today ? 'Today' : formatMonthDay(period.start)
    case 'week': return current ? 'Last 7 days' : 'That week'
    case 'month': return current ? 'Last 30 days' : 'Those 30 days'
    case 'year': return period.start.slice(0, 4)
    case 'all': return 'All time'
  }
}

// ── Grouping ────────────────────────────────────────────────────────────

export interface DayStat {
  day: DayKey
  entries: MoodEntry[]
  average: number
  min: number
  max: number
}

export function dailyStats(entries: readonly MoodEntry[], timeZone: string): DayStat[] {
  const byDay = new Map<DayKey, MoodEntry[]>()
  for (const entry of entries) {
    const key = dayKey(entry.loggedAt, timeZone)
    byDay.set(key, [...(byDay.get(key) ?? []), entry])
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, list]) => {
      const s = summarizeScores(list.map(e => e.score))
      return { day, entries: list.sort((a, b) => a.loggedAt.localeCompare(b.loggedAt)), average: s.average!, min: s.min!, max: s.max! }
    })
}

export function populationSd(values: readonly number[]): number | null {
  if (values.length < 2) return null
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length)
}

export function tagCounts(entries: readonly MoodEntry[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const entry of entries) for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  return counts
}

// ── Stats strip ─────────────────────────────────────────────────────────

export interface StatCell {
  key: string
  value: string
  sub: string
  /** Colours the sub line (the average's change). */
  tone?: 'positive' | 'negative' | 'muted'
}

export function timelineStats(
  entries: readonly MoodEntry[],
  previous: readonly MoodEntry[] | null,
  period: Period,
  today: DayKey,
  timeZone: string,
): StatCell[] {
  const summary = summarizeScores(entries.map(e => e.score))
  const previousAverage = previous ? summarizeScores(previous.map(e => e.score)).average : null

  let averageSub: Pick<StatCell, 'sub' | 'tone'> = { sub: '', tone: 'muted' }
  if (summary.average != null && previousAverage != null) {
    const delta = summary.average - previousAverage
    averageSub = { sub: `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(1)} vs previous`, tone: delta >= 0 ? 'positive' : 'negative' }
  }
  else if (summary.average != null && period.range !== 'all') {
    averageSub = { sub: 'Nothing earlier to compare', tone: 'muted' }
  }

  const days = elapsedDays(period, today)
  const checkIns: StatCell = {
    key: 'Check-ins',
    value: summary.count.toLocaleString('en-GB'),
    sub: period.range === 'day' || !days ? '' : `${(summary.count / days).toFixed(1)} a day`,
  }

  let spread: StatCell
  if (period.range === 'day') {
    spread = { key: 'Range', value: formatRange(summary), sub: '' }
  }
  else {
    const sd = populationSd(dailyStats(entries, timeZone).map(d => d.average))
    spread = sd == null
      ? { key: 'Stability', value: '—', sub: '' }
      : { key: 'Stability', value: sd < 0.8 ? 'Steady' : sd < 1.2 ? 'Mixed' : 'Variable', sub: `±${sd.toFixed(1)} day to day` }
  }

  const top = [...tagCounts(entries)].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]

  return [
    { key: 'Average', value: formatAverage(summary.average), ...averageSub },
    checkIns,
    spread,
    { key: 'Most logged', value: top?.[0] ?? '—', sub: top ? `${top[1]}×` : '' },
  ]
}

// ── Moments ─────────────────────────────────────────────────────────────

/** Top `limit` noted entries by score (best) or lowest score; ties go to the more recent; repeated notes once. */
export function moments(entries: readonly MoodEntry[], kind: 'best' | 'lowest', limit = 3): MoodEntry[] {
  const direction = kind === 'best' ? -1 : 1
  const sorted = entries
    .filter(e => e.note.trim())
    .sort((a, b) => direction * (a.score - b.score) || b.loggedAt.localeCompare(a.loggedAt))
  const seen = new Set<string>()
  return sorted.filter((e) => {
    const key = e.note.trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, limit)
}

// ── Patterns ────────────────────────────────────────────────────────────

export const PATTERNS_FALLBACK = 'Not enough entries in this period to say anything with confidence yet.'

const BLOCKS = [
  { name: 'mornings', test: (m: number) => m < 720 },
  { name: 'afternoons', test: (m: number) => m >= 720 && m < 1080 },
  { name: 'evenings', test: (m: number) => m >= 1080 },
] as const

/** Up to three plain-language associations; correlation wording only. */
export function patterns(entries: readonly MoodEntry[], period: Period, timeZone: string): string[] {
  if (entries.length < 6) return [PATTERNS_FALLBACK]
  const average = summarizeScores(entries.map(e => e.score)).average!
  const found: string[] = []

  // 1. Time of day
  const blocks = BLOCKS
    .map(block => ({ name: block.name, scores: entries.filter(e => block.test(minuteOfDay(e.loggedAt, timeZone))).map(e => e.score) }))
    .filter(block => block.scores.length >= 2)
    .map(block => ({ name: block.name, average: summarizeScores(block.scores).average! }))
  if (blocks.length >= 2) {
    const sorted = [...blocks].sort((a, b) => a.average - b.average)
    const low = sorted[0]!
    const high = sorted.at(-1)!
    if (high.average > low.average) {
      found.push(`Your mood was generally lowest in the ${low.name}, averaging ${low.average.toFixed(1)}, and highest in the ${high.name} at ${high.average.toFixed(1)}.`)
    }
  }

  // 2. Tag that sits highest above the average
  const minCount = period.range === 'day' ? 1 : 4
  const tagged = [...tagCounts(entries)]
    .filter(([, count]) => count >= minCount)
    .map(([tag, count]) => ({ tag, count, diff: summarizeScores(entries.filter(e => e.tags.includes(tag)).map(e => e.score)).average! - average }))
    .sort((a, b) => b.diff - a.diff)[0]
  if (tagged && tagged.diff > 0.3) {
    found.push(`Entries tagged ${tagged.tag} averaged ${tagged.diff.toFixed(1)} points above your ${period.range === 'day' ? 'day' : 'period'} average (${tagged.count} entries).`)
  }

  // 3. Tag shared by the lowest noted entries
  const low = entries.filter(e => e.note.trim() && e.score <= 4)
  if (low.length >= 3) {
    const top = [...tagCounts(low)].sort((a, b) => b[1] - a[1])[0]
    if (top && top[1] >= 2) found.push(`${top[1]} of your ${low.length} lowest noted entries were tagged ${top[0]}.`)
  }

  return found.length ? found : [PATTERNS_FALLBACK]
}
