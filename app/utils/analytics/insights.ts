// Insights: patterns within the user's own entries, each with how much evidence
// it rests on. Pure functions, ported from the design's Insights logic. Wording
// stays with associations ("tended to", "often"), never causes.

import type { JourneySpan } from '~/types/journey'
import type { MoodEntry } from '~/types/mood'
import { addDays, type DayKey, dayKey, minuteOfDay, weekdayIndex } from '~/utils/date'
import { type AttemptMood, moodChange } from '~/utils/journey'

// ── Ranges ────────────────────────────────────────────────────────────
export type InsightsRange = 30 | 90 | 365 | 'all'

export const INSIGHTS_RANGES: readonly { value: InsightsRange, label: string }[] = [
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '1 year' },
  { value: 'all', label: 'All time' },
]

export const isInsightsRange = (value: unknown): value is InsightsRange => INSIGHTS_RANGES.some(r => String(r.value) === String(value))

/** The first day of the range (inclusive, `days` days ending today), or null for all time. */
export function rangeStart(range: InsightsRange, today: DayKey): DayKey | null {
  return range === 'all' ? null : addDays(today, -(range - 1))
}

// ── Evidence ──────────────────────────────────────────────────────────
export type EvidenceLevel = 1 | 2 | 3

/** strong (≥ 120 entries), some (≥ 40), otherwise an early signal. */
export const evidenceLevel = (entries: number): EvidenceLevel => (entries >= 120 ? 3 : entries >= 40 ? 2 : 1)

/** "Some evidence · 64 entries". */
export function evidenceText(entries: number): string {
  const label = ['Early signal', 'Some evidence', 'Strong evidence'][evidenceLevel(entries) - 1]
  return `${label} · ${entries.toLocaleString('en-GB')} ${entries === 1 ? 'entry' : 'entries'}`
}

// ── Building blocks ───────────────────────────────────────────────────
const mean = (values: readonly number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)
const pad = (n: number) => String(n).padStart(2, '0')
// Sign after rounding, so −0.02 reads "+0.0" rather than "−0.0".
const signed = (v: number) => {
  const rounded = Math.sign(v) * Math.round(Math.abs(v) * 10) / 10
  return `${rounded < 0 ? '−' : '+'}${Math.abs(rounded).toFixed(1)}`
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** Hours shown on the "average day" chart (07:00–23:59), as in the design. */
export const FIRST_HOUR = 7
export const LAST_HOUR = 23
const MIN_HOUR_ENTRIES = 3
const MIN_TAG_ENTRIES = 5
const AFTER_WINDOW_MIN = 240

export interface HourStat {
  hour: number
  average: number
  /** Lower and upper quartile: the band covers the middle half of entries. */
  q1: number
  q3: number
  entries: number
}

export interface TagNote {
  id: string
  loggedAt: string
  note: string
  score: number
}

export interface TagStat {
  tag: string
  entries: number
  /** Average when tagged minus the range average. */
  difference: number
  withAverage: number
  withoutAverage: number | null
  /** Mean change from the check-in before to those in the next four hours; null without pairs. */
  after: number | null
  /** How many of those pairs went up. */
  up: number
  cases: number
  /** The three latest noted entries with the tag, newest first. */
  notes: TagNote[]
}

export interface Notice {
  text: string
  /** How many entries it rests on (drives the evidence meter). */
  entries: number
}

export interface InsightsModel {
  entries: number
  average: number | null
  hours: HourStat[]
  /** Monday first; null where there are no check-ins. */
  weekdays: (number | null)[]
  /** Most above average first. */
  tags: TagStat[]
  notices: Notice[]
}

export function hourStats(entries: readonly MoodEntry[], timeZone: string): HourStat[] {
  const byHour = new Map<number, number[]>()
  for (const e of entries) {
    const hour = Math.floor(minuteOfDay(e.loggedAt, timeZone) / 60)
    byHour.set(hour, [...(byHour.get(hour) ?? []), e.score])
  }
  const stats: HourStat[] = []
  for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour++) {
    const scores = (byHour.get(hour) ?? []).sort((a, b) => a - b)
    if (scores.length < MIN_HOUR_ENTRIES) continue
    stats.push({
      hour,
      average: mean(scores)!,
      q1: scores[Math.floor(scores.length * 0.25)]!,
      q3: scores[Math.floor(scores.length * 0.75)]!,
      entries: scores.length,
    })
  }
  return stats
}

export function weekdayAverages(entries: readonly MoodEntry[], timeZone: string): (number | null)[] {
  const byDay: number[][] = WEEKDAYS.map(() => [])
  for (const e of entries) byDay[weekdayIndex(dayKey(e.loggedAt, timeZone))]!.push(e.score)
  return byDay.map(mean)
}

/**
 * Every tag used at least five times in the range, against the range average.
 * "After" compares the check-in just before a tagged one with the average of
 * the check-ins in the next four hours, on the same day (`all` supplies the
 * neighbours, so the range edge doesn't cut pairs off).
 */
export function tagStats(entries: readonly MoodEntry[], all: readonly MoodEntry[], timeZone: string): TagStat[] {
  const average = mean(entries.map(e => e.score))
  if (average === null) return []
  const byDay = new Map<DayKey, MoodEntry[]>()
  for (const e of [...all].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))) {
    const key = dayKey(e.loggedAt, timeZone)
    byDay.set(key, [...(byDay.get(key) ?? []), e])
  }
  const tags = [...new Set(entries.flatMap(e => e.tags))]
  return tags
    .map((tag) => {
      const tagged = entries.filter(e => e.tags.includes(tag))
      const others = entries.filter(e => !e.tags.includes(tag))
      const deltas: number[] = []
      for (const e of tagged) {
        const day = byDay.get(dayKey(e.loggedAt, timeZone)) ?? []
        const at = Date.parse(e.loggedAt)
        const before = day.filter(x => x.id !== e.id && Date.parse(x.loggedAt) < at).at(-1)
        const after = day.filter(x => Date.parse(x.loggedAt) > at && Date.parse(x.loggedAt) - at <= AFTER_WINDOW_MIN * 60_000)
        if (before && after.length) deltas.push(mean(after.map(x => x.score))! - before.score)
      }
      const withAverage = mean(tagged.map(e => e.score))!
      return {
        tag,
        entries: tagged.length,
        difference: withAverage - average,
        withAverage,
        withoutAverage: mean(others.map(e => e.score)),
        after: mean(deltas),
        up: deltas.filter(d => d > 0).length,
        cases: deltas.length,
        notes: tagged.filter(e => e.note.trim()).slice(-3).reverse().map(e => ({ id: e.id, loggedAt: e.loggedAt, note: e.note.trim(), score: e.score })),
      }
    })
    .filter(s => s.entries >= MIN_TAG_ENTRIES)
    .sort((a, b) => b.difference - a.difference)
}

/** "Worth noticing": up to four patterns, in the design's order of interest. */
export function notices(entries: readonly MoodEntry[], hours: readonly HourStat[], weekdays: readonly (number | null)[], tags: readonly TagStat[], timeZone: string): Notice[] {
  const average = mean(entries.map(e => e.score))
  if (average === null) return []
  const found: Notice[] = []

  // The lowest stretch of the day: the lowest hour plus neighbouring hours that are also below average.
  if (hours.length) {
    const low = hours.reduce((a, b) => (b.average < a.average ? b : a))
    const index = hours.indexOf(low)
    const below = (k: number) => {
      const h = hours[k]
      return h !== undefined && h.average < average - 0.15 && Math.abs(h.hour - low.hour) <= 3
    }
    let left = index
    let right = index
    while (right - left < 3) {
      const l = below(left - 1) ? hours[left - 1]!.average : Infinity
      const r = below(right + 1) ? hours[right + 1]!.average : Infinity
      if (l === Infinity && r === Infinity) break
      if (l <= r) left--
      else right++
    }
    const from = hours[left]!.hour
    const to = hours[right]!.hour + 1
    const within = entries.filter((e) => {
      const minute = minuteOfDay(e.loggedAt, timeZone)
      return minute >= from * 60 && minute < to * 60
    }).length
    found.push({ text: `Your mood was generally lowest between ${pad(from)}:00 and ${pad(to % 24)}:00.`, entries: within })
  }

  const rising = tags.filter(t => t.cases >= 8 && (t.after ?? 0) > 0.3).sort((a, b) => b.after! - a.after!)[0]
  if (rising) {
    found.push({
      text: `Your mood often rose in the few hours after logging ${rising.tag}. It went up ${rising.up} out of ${rising.cases} times you checked in before and after.`,
      entries: rising.cases,
    })
  }

  const lows = entries.filter(e => e.score <= 3)
  if (lows.length >= 5) {
    const tired = lows.filter(e => e.tags.includes('Tired') || /sleep|tired/i.test(e.note)).length
    if (tired >= 2) found.push({ text: `${tired} of your ${lows.length} lowest entries mentioned tiredness or poor sleep.`, entries: lows.length })
  }

  const heaviest = tags.filter(t => t.entries >= 10).sort((a, b) => a.difference - b.difference)[0]
  if (heaviest && heaviest.difference < -0.4) {
    found.push({ text: `Entries tagged ${heaviest.tag} sat ${Math.abs(heaviest.difference).toFixed(1)} points below your average.`, entries: heaviest.entries })
  }

  const known = weekdays.filter((v): v is number => v !== null)
  if (known.length >= 2) {
    const best = Math.max(...known)
    const worst = Math.min(...known)
    if (best - worst > 0.3) {
      found.push({ text: `${WEEKDAYS[weekdays.indexOf(best)]}s were your best days on average, ${WEEKDAYS[weekdays.indexOf(worst)]}s your hardest.`, entries: entries.length })
    }
  }

  return found.slice(0, 4)
}

/**
 * Everything the Insights page shows for `entries` (the range). `all` adds
 * same-day neighbours for the "after" comparison; it defaults to `entries`.
 */
export function insightsModel(entries: readonly MoodEntry[], timeZone: string, all: readonly MoodEntry[] = entries): InsightsModel {
  const hours = hourStats(entries, timeZone)
  const weekdays = weekdayAverages(entries, timeZone)
  const tags = tagStats(entries, all, timeZone)
  return {
    entries: entries.length,
    average: mean(entries.map(e => e.score)),
    hours,
    weekdays,
    tags,
    notices: notices(entries, hours, weekdays, tags, timeZone),
  }
}

// ── Chart helpers ─────────────────────────────────────────────────────
/** Hour chart scale: 2.5–8.75 mapped into the middle 80% of the plot (design), as SVG y for `height`. */
export function hourChartY(value: number, height: number): number {
  const v = Math.max(2.5, Math.min(8.75, value))
  return ((1 - (v - 2.5) / 6.25) * 0.8 + 0.1) * height
}

/** x of an hour's average (its middle), 0–1 across 07:00–24:00. */
export const hourX = (hour: number) => (hour + 0.5 - FIRST_HOUR) / (LAST_HOUR + 1 - FIRST_HOUR)

export interface DiffBar {
  /** Share of the half-width, 0–0.88. */
  width: number
  label: string
}

/** Diverging bars, scaled to the largest difference (at least half a point). */
export function tagBars(tags: readonly TagStat[]): { tag: string, lower: DiffBar | null, higher: DiffBar | null, level: EvidenceLevel }[] {
  const max = Math.max(0.5, ...tags.map(t => Math.abs(t.difference)))
  return tags.map(t => ({
    tag: t.tag,
    lower: t.difference < 0 ? { width: (-t.difference / max) * 0.88, label: signed(t.difference) } : null,
    higher: t.difference > 0 ? { width: (t.difference / max) * 0.88, label: signed(t.difference) } : null,
    level: evidenceLevel(t.entries),
  }))
}

/** "+0.4" / "−0.6" with a real minus sign. */
export const formatSigned = signed

// ── Before and during journeys ────────────────────────────────────────
export interface JourneyComparisonRow {
  /** The attempt's id. */
  id: string
  /** "Nicotine-free · #2". */
  name: string
  /** "Day 12 · active", "Completed · 90 days". */
  status: string
  before: number
  during: number
  change: number
}

/** The comparison's fixed scale: 3.5–7.5, with 4–7 labelled. */
export const COMPARISON_SCALE = { min: 3.5, max: 7.5, labels: [4, 5, 6, 7] } as const

export const comparisonX = (value: number) =>
  (Math.max(COMPARISON_SCALE.min, Math.min(COMPARISON_SCALE.max, value)) - COMPARISON_SCALE.min) / (COMPARISON_SCALE.max - COMPARISON_SCALE.min)

/** Attempts with enough check-ins before and during (see MIN_COMPARISON_ENTRIES), newest first. */
export function journeyComparison(spans: readonly JourneySpan[], moods: ReadonlyMap<string, AttemptMood>): JourneyComparisonRow[] {
  return spans.flatMap((span) => {
    const mood = moods.get(span.id)
    const change = moodChange(mood)
    if (!mood || change === null) return []
    return [{ id: span.id, name: span.name, status: span.statusLabel, before: mood.beforeAverage!, during: mood.duringAverage!, change }]
  }).reverse()
}
