// The journey page ("the climb"): the floor column, next floor and evidence,
// the daily mood chart, phases, notes and header lines. Pure functions, ported
// from the design's journey view and generalised to each journey's own floors.

import type { Journey, JourneyAttempt } from '~/types/journey'
import type { MoodEntry } from '~/types/mood'
import { dayKey, formatTime, minuteOfDay, monthShort } from '~/utils/date'
import { attemptState, removesNicotine } from '~/utils/journey'
import { wizardFloors } from '~/utils/journeyWizard'

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`
const average = (values: readonly number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)
const dayMonth = (at: number | string, timeZone: string) => {
  const key = dayKey(at, timeZone)
  return `${Number(key.slice(8, 10))} ${monthShort(Number(key.slice(5, 7)))}`
}

/** The moment an attempt is looked at: now while it runs, else when it ended. */
export interface AttemptView {
  journey: Journey
  attempt: JourneyAttempt
  active: boolean
  /** The day it's on (or ended on), 1-based. */
  day: number
  /** "Now" for the attempt: the current time, or its end. */
  atMs: number
  startMs: number
  /** Index in `journey.checkpoints` of the floor reached. */
  current: number
  /** Index of the next floor; null at the summit or once ended. */
  next: number | null
}

export function attemptView(journey: Journey, attempt: JourneyAttempt, nowMs: number): AttemptView {
  const state = attemptState(attempt, journey.lengthDays, nowMs)
  const active = state.status === 'active'
  const cps = journey.checkpoints
  let current = 0
  cps.forEach((c, i) => {
    if (state.day >= c) current = i
  })
  const next = active && current + 1 < cps.length ? current + 1 : null
  return { journey, attempt, active, day: state.day, atMs: state.endMs ?? nowMs, startMs: Date.parse(attempt.startedAt), current, next }
}

/** Journey day (1-based) a moment falls in, counted from the start to the hour. */
export const dayOfAttempt = (view: AttemptView, at: string) => Math.floor((Date.parse(at) - view.startMs) / DAY_MS) + 1

/** "in 1d 13h", "in 5h 12m". */
export function shortCountdown(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  return days > 0 ? `in ${days}d ${hours}h` : `in ${hours}h ${minutes % 60}m`
}

// ── Header ────────────────────────────────────────────────────────────
/** "Attempt 2 · Started 24 Sep, 10:00 · Previous attempt: 4 days", plus how it ended. */
export function headerMeta(view: AttemptView, timeZone: string): string {
  const { journey, attempt } = view
  const index = journey.attempts.indexOf(attempt)
  const previous = index > 0 ? journey.attempts[index - 1] : undefined
  const setbacks = attempt.setbacks.filter(s => s.outcome === 'continued').length
  const state = attemptState(attempt, journey.lengthDays, view.atMs)
  const ending = view.active
    ? null
    : { completed: `Completed on Day ${state.day}`, setback: `Ended on Day ${state.day} after a setback`, paused: `Paused on Day ${state.day}`, active: null }[state.status]
  return [
    journey.attempts.length > 1 && `Attempt ${attempt.number}`,
    `Started ${dayMonth(attempt.startedAt, timeZone)}, ${formatTime(attempt.startedAt, timeZone)}`,
    previous && `Previous attempt: ${plural(attemptState(previous, journey.lengthDays, view.atMs).day, 'day')}`,
    setbacks > 0 && `${plural(setbacks, 'setback')} recorded`,
    ending,
  ].filter(Boolean).join(' · ')
}

/** "Written 24 Sep, before Day 1" (shown uppercase). */
export function whyLabel(journey: Journey, timeZone: string): string {
  const first = journey.attempts[0]
  const before = first && Date.parse(journey.whyWrittenAt) <= Date.parse(first.startedAt) + HOUR_MS
  return `Written ${dayMonth(journey.whyWrittenAt, timeZone)}${before ? ', before Day 1' : ''}`
}

// ── The climb ─────────────────────────────────────────────────────────
export interface ClimbStep {
  key: string
  /** "DAY 14", "SUMMIT", or "Day 1" for the ground floor below the current one. */
  label: string
  kind: 'future' | 'next' | 'current' | 'past'
  note: string
  opacity: number
  /** Blur in px for floors further ahead. */
  blur: number
  /** A short connector pill below this floor. */
  pill: boolean
  /** The progress tube below this floor (the next one). */
  tube: boolean
}

export interface TubeTick {
  /** Height from the bottom of the tube, 0–1. */
  bottom: number
  label: string
  /** Distance in days from today; 0 is today. */
  distance: number
}

export interface Climb {
  /** Top to bottom: floors ahead, the next floor, the tube, the current floor, floors behind. */
  steps: ClimbStep[]
  tube: { progress: number, ticks: TubeTick[] } | null
}

export function climb(view: AttemptView, timeZone: string): Climb {
  const { journey, current, next, day, startMs, atMs } = view
  const cps = journey.checkpoints
  const opensAt = (d: number) => startMs + (d - 1) * DAY_MS
  const date = (d: number) => dayMonth(opensAt(d), timeZone)
  const label = (k: number) => (cps[k] === journey.lengthDays ? 'SUMMIT' : `DAY ${cps[k]}`)
  const reached = (k: number) => (k === 0 ? `Started ${date(1)}` : `Reached ${date(cps[k]!)}`)
  const steps: ClimbStep[] = []

  if (next !== null) {
    for (let k = Math.min(next + 2, cps.length - 1); k > next; k--) {
      const distance = k - next
      steps.push({ key: `f${k}`, label: label(k), kind: 'future', note: `Opens ${date(cps[k]!)}`, opacity: distance === 1 ? 0.45 : 0.22, blur: distance === 1 ? 0 : 0.6, pill: true, tube: false })
    }
    steps.push({ key: `n${next}`, label: label(next), kind: 'next', note: `Opens ${date(cps[next]!)} · ${shortCountdown(opensAt(cps[next]!) - atMs)}`, opacity: 1, blur: 0, pill: false, tube: true })
  }
  steps.push({ key: `c${current}`, label: label(current), kind: 'current', note: reached(current), opacity: 1, blur: 0, pill: current > 0, tube: false })
  for (let k = current - 1; k >= 0; k--) {
    steps.push({ key: `p${k}`, label: k === 0 ? 'Day 1' : label(k), kind: 'past', note: reached(k), opacity: k === current - 1 ? 0.85 : 0.6, blur: 0, pill: k > 0, tube: false })
  }

  if (next === null) return { steps, tube: null }
  const from = cps[current]!
  const span = cps[next]! - from
  const elapsedHours = (atMs - startMs) / HOUR_MS
  const progress = Math.max(0, Math.min(1, (elapsedHours - (from - 1) * 24) / (span * 24)))
  const ticks: TubeTick[] = []
  for (let d = Math.max(from + 1, day - 4); d < day; d++) {
    ticks.push({ bottom: (d - from) / span, label: day - d === 1 ? `Day ${d}` : String(d), distance: day - d })
  }
  ticks.push({ bottom: progress, label: `Day ${day}`, distance: 0 })
  return { steps, tube: { progress, ticks } }
}

// ── Next floor ────────────────────────────────────────────────────────
export interface NextFloor {
  day: number
  /** "in 1d 13h". */
  countdown: string
  /** The same "often reported" copy the wizard showed for this floor. */
  expectation: string
}

export function nextFloor(view: AttemptView): NextFloor | null {
  if (view.next === null) return null
  const { journey } = view
  const day = journey.checkpoints[view.next]!
  const floor = wizardFloors(journey.lengthDays, [], journey.rules).find(f => f.day === day)
  return { day, countdown: shortCountdown(view.startMs + (day - 1) * DAY_MS - view.atMs), expectation: floor?.expectation ?? '' }
}

export interface EvidenceRow {
  topic: string
  /** What people often report (general, hedged). */
  common: string
  /** What the user's own entries say. */
  yours: string
}

const CRAVING_TAG = 'Nicotine craving'
const GOOD_SLEEP_TAG = 'Good sleep'
const MIN_STRETCH_ENTRIES = 3

/** "Mornings are your lowest stretch, 10:00–13:00", from three-hour windows. */
export function lowestStretch(entries: readonly MoodEntry[], timeZone: string): string | null {
  const windows = new Map<number, number[]>()
  for (const e of entries) {
    const start = Math.floor(minuteOfDay(e.loggedAt, timeZone) / 180) * 3
    windows.set(start, [...(windows.get(start) ?? []), e.score])
  }
  const usable = [...windows].filter(([, scores]) => scores.length >= MIN_STRETCH_ENTRIES)
  if (usable.length < 2) return null
  const [start] = usable.reduce((low, w) => (average(w[1])! < average(low[1])! ? w : low))
  const part = start < 12 ? 'Mornings are' : start < 17 ? 'Afternoons are' : 'Evenings are'
  const pad = (h: number) => `${String(h % 24).padStart(2, '0')}:00`
  return `${part} your lowest stretch, ${pad(start)}–${pad(start + 3)}`
}

const rate = (count: number, days: number) => (count / days).toFixed(1)

/** "Often reported" next to what the user's entries say, for the next floor. */
export function evidence(view: AttemptView, during: readonly MoodEntry[], before: readonly MoodEntry[], timeZone: string): EvidenceRow[] {
  const dayOf = (e: MoodEntry) => dayOfAttempt(view, e.loggedAt)
  const lastWeek = during.filter(e => dayOf(e) > view.day - 7)
  const nights = Math.min(7, view.day)
  const goodSleep = new Set(during.filter(e => dayOf(e) > view.day - nights && e.tags.includes(GOOD_SLEEP_TAG)).map(dayOf)).size
  const sleep = { topic: 'Sleep', common: 'Often unsettled in the first weeks', yours: `“Good sleep” tagged on ${goodSleep} of the last ${plural(nights, 'night')}` }
  const stretch = lowestStretch(during, timeZone) ?? 'Not enough check-ins yet to tell'

  if (!removesNicotine(view.journey)) {
    const now = average(during.map(e => e.score))
    const then = average(before.map(e => e.score))
    const mood = now !== null && then !== null && during.length >= MIN_STRETCH_ENTRIES && before.length >= MIN_STRETCH_ENTRIES
      ? `Averaging ${now.toFixed(1)} since Day 1, against ${then.toFixed(1)} before`
      : 'Not enough check-ins yet to compare'
    return [
      { topic: 'Mood', common: 'Often uneven in the first weeks', yours: mood },
      { topic: 'Time of day', common: 'Some parts of the day may feel harder for a while', yours: stretch },
      sleep,
    ]
  }

  const cravings = (list: readonly MoodEntry[]) => list.filter(e => e.tags.includes(CRAVING_TAG)).length
  let yours: string
  if (view.day <= 7) {
    const count = cravings(during)
    yours = count ? `About ${rate(count, view.day)} a day so far` : 'None logged so far'
  }
  else {
    const now = Number(rate(cravings(lastWeek), 7))
    const first = Number(rate(cravings(during.filter(e => dayOf(e) <= 7)), 7))
    const trend = now < first ? `down from ${first.toFixed(1)}` : now > first ? `up from ${first.toFixed(1)}` : 'the same as'
    yours = `About ${now.toFixed(1)} a day this week, ${trend} in week one`
  }
  return [
    { topic: 'Cravings', common: 'Less frequent, though sudden urges still happen', yours },
    { topic: 'Focus', common: 'Gradually returning, often unevenly', yours: stretch },
    sleep,
  ]
}

// ── Mood chart ────────────────────────────────────────────────────────
export interface DayPoint {
  day: number
  value: number
  /** 0–1 across the chart. */
  x: number
  /** 0–1 from the top (10 at the top, 0 at the bottom). */
  y: number
  latest: boolean
  belowBaseline: boolean
}

export interface JourneyChartModel {
  points: DayPoint[]
  /** Average over the 30 days before the start; null without check-ins. */
  baseline: number | null
  /** x of the floors drawn as faint verticals. */
  guides: number[]
  marks: { x: number, label: string, current: boolean }[]
}

/** Daily averages of the attempt so far, against the 30 days before it. */
export function journeyChart(view: AttemptView, during: readonly MoodEntry[], before: readonly MoodEntry[]): JourneyChartModel {
  const cps = view.journey.checkpoints
  const byDay = new Map<number, number[]>()
  for (const e of during) {
    const d = dayOfAttempt(view, e.loggedAt)
    if (d >= 1 && d <= view.day) byDay.set(d, [...(byDay.get(d) ?? []), e.score])
  }
  const days = [...byDay.keys()].sort((a, b) => a - b)
  const xMax = view.next !== null ? Math.max(cps[view.next]!, view.day + 1) : view.active ? view.journey.lengthDays : view.day + 1
  const baseline = average(before.map(e => e.score))
  const x = (d: number) => d / xMax
  const points = days.map((day, i) => {
    const value = average(byDay.get(day)!)!
    return { day, value, x: x(day), y: 1 - value / 10, latest: i === days.length - 1, belowBaseline: baseline !== null && value < baseline }
  })

  const candidates: [number, string][] = [...cps.filter(c => c <= xMax).map(c => [c, `Day ${c}`] as [number, string]), [view.day, `Day ${view.day}`]]
  const unique = candidates.filter(([d], i) => candidates.findIndex(([e]) => e === d) === i).sort((a, b) => a[0] - b[0])
  const marks = unique
    .filter(([d], i) => i === 0 || d === view.day || Math.abs(d - view.day) / xMax > 0.15)
    .map(([d, label]) => ({ x: x(d), label, current: d === view.day }))

  return { points, baseline, guides: cps.filter(c => c > 1 && c < xMax).map(x), marks }
}

export interface Phase {
  label: string
  value: number | null
  tone: 'before' | 'past' | 'current'
}

/** Before, then the stretches between floors up to today (the last three). */
export function phases(view: AttemptView, during: readonly MoodEntry[], before: readonly MoodEntry[]): Phase[] {
  const cps = view.journey.checkpoints
  const segments: Phase[] = []
  for (let i = 1; i < cps.length; i++) {
    const start = i === 1 ? 1 : cps[i - 1]! + 1
    if (start > view.day) break
    const end = Math.min(cps[i]!, view.day)
    const scores = during.filter((e) => {
      const d = dayOfAttempt(view, e.loggedAt)
      return d >= start && d <= end
    }).map(e => e.score)
    segments.push({ label: start === end ? `Day ${start}` : `Days ${start}–${end}`, value: average(scores), tone: 'past' })
  }
  const shown = segments.slice(-3)
  if (shown.length) shown[shown.length - 1]!.tone = 'current'
  return [{ label: 'Before', value: average(before.map(e => e.score)), tone: 'before' }, ...shown]
}

/** "Your lowest day was Day 2. Since Day 9 your daily average has stayed above where you were before you started." */
export function moodSummary(chart: JourneyChartModel): string {
  const { points, baseline } = chart
  if (points.length < 2) return ''
  const lowest = points.reduce((low, p) => (p.value < low.value ? p : low))
  const parts = [`Your lowest day was Day ${lowest.day}.`]
  if (baseline !== null) {
    let start = points.length
    while (start > 0 && points[start - 1]!.value > baseline) start--
    const streak = points.length - start
    if (start === 0) parts.push('Every day so far has averaged above where you were before you started.')
    else if (streak >= 2) parts.push(`Since Day ${points[start]!.day} your daily average has stayed above where you were before you started.`)
  }
  return parts.join(' ')
}

// ── Notes ─────────────────────────────────────────────────────────────
export interface JourneyNote {
  id: string
  day: number
  text: string
  score: number
}

/**
 * One note per day of the attempt: preferring notes about the journey (its
 * rules, or a craving tag), then the one furthest from that day's average.
 * When few notes are about the journey, any day's note is used. The latest `limit`, oldest first.
 */
export function journeyNotes(view: AttemptView, during: readonly MoodEntry[], limit = 6): JourneyNote[] {
  const words = view.journey.rules.flatMap(r => r.label.toLowerCase().split(/[^\p{L}\p{N}]+/u)).filter(w => w.length >= 4)
  const relevant = (e: MoodEntry) => e.tags.includes(CRAVING_TAG) || words.some(w => e.note.toLowerCase().includes(w))
  const byDay = new Map<number, MoodEntry[]>()
  for (const e of during) {
    const d = dayOfAttempt(view, e.loggedAt)
    if (d >= 1) byDay.set(d, [...(byDay.get(d) ?? []), e])
  }
  const picks = [...byDay].sort((a, b) => a[0] - b[0]).flatMap(([day, entries]) => {
    const mean = average(entries.map(e => e.score))!
    const noted = entries.filter(e => e.note.trim())
    if (!noted.length) return []
    const best = noted.reduce((pick, e) => {
      const better = Number(relevant(e)) - Number(relevant(pick)) || Math.abs(e.score - mean) - Math.abs(pick.score - mean)
      return better > 0 ? e : pick
    })
    return [{ day, entry: best, relevant: relevant(best) }]
  })
  const chosen = picks.filter(p => p.relevant).length >= 3 ? picks.filter(p => p.relevant) : picks
  return chosen.slice(-limit).map(({ day, entry }) => ({ id: entry.id, day, text: entry.note.trim(), score: entry.score }))
}
