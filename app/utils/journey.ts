// Journey rules of the game: floors, day counting, attempt status, and the
// list views built from them. Pure functions; the data comes from useJourneys.

import type { Journey, JourneyAttempt, JourneySpan, JourneyStatus, JourneySummary, RuleKind } from '~/types/journey'
import { addDays, type DayKey, dayKey, monthShort } from '~/utils/date'

/** Days a journey checkpoint ("floor") is reached on. Day 1 is the ground floor. */
export const CHECKPOINT_DAYS: readonly number[] = [1, 3, 7, 14, 30, 60, 90]

export const JOURNEY_LENGTHS = [30, 60, 90] as const

/** Dot colors for journeys in lists. Stored as the key; mirrors the database check. */
export const JOURNEY_COLORS = {
  amber: 'oklch(0.83 0.1 72)',
  blue: 'oklch(0.64 0.06 232)',
  sand: 'oklch(0.72 0.018 85)',
  slate: 'oklch(0.58 0.075 262)',
} as const

export type JourneyColor = keyof typeof JOURNEY_COLORS

export const isJourneyColor = (value: string): value is JourneyColor => value in JOURNEY_COLORS

/** The first color no running journey uses (amber, then blue, …). */
export function nextJourneyColor(used: readonly JourneyColor[]): JourneyColor {
  const keys = Object.keys(JOURNEY_COLORS) as JourneyColor[]
  return keys.find(key => !used.includes(key)) ?? keys[used.length % keys.length]!
}

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'] as const
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const

/** "the third floor" for the checkpoint at `index` in CHECKPOINT_DAYS. */
export function floorName(index: number): string {
  return `the ${ORDINALS[index] ?? `${index + 1}th`} floor`
}

/** "III" for the checkpoint at `index` in CHECKPOINT_DAYS; the last floor is the summit. */
export function floorRoman(index: number, isLast: boolean): string {
  return isLast ? 'SUMMIT' : ROMAN[index] ?? String(index + 1)
}

// Attempt labels follow the design's lane names: "Nicotine-free · #2".
const ATTEMPT_SUFFIX = / · #(\d+)$/

/** The journey's name without the attempt suffix ("Nicotine-free"). */
export function journeyBaseName(name: string): string {
  return name.replace(ATTEMPT_SUFFIX, '')
}

/** The attempt number from a "Name · #N" label, or null. */
export function journeyAttempt(name: string): number | null {
  const match = ATTEMPT_SUFFIX.exec(name)
  return match ? Number(match[1]) : null
}

// ── Time ──────────────────────────────────────────────────────────────
const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS

/** Day N opens (N − 1) × 24 h after the start, to the hour, as in the design. */
export function journeyDay(startedAt: string, nowMs: number): number {
  return Math.max(1, Math.floor((nowMs - Date.parse(startedAt)) / DAY_MS) + 1)
}

export type AttemptStatus = 'active' | 'completed' | 'setback' | 'paused'

export interface AttemptState {
  status: AttemptStatus
  /** When it ended (or reached its length); null while running. */
  endMs: number | null
  /** The day it is on, or the last day it reached. */
  day: number
}

/** An attempt is active until it's ended or has run its full length. */
export function attemptState(attempt: JourneyAttempt, lengthDays: number, nowMs: number): AttemptState {
  const start = Date.parse(attempt.startedAt)
  if (attempt.endedAt) {
    const end = Date.parse(attempt.endedAt)
    return { status: attempt.endReason ?? 'completed', endMs: end, day: Math.min(lengthDays, journeyDay(attempt.startedAt, end)) }
  }
  const fullEnd = start + lengthDays * DAY_MS
  if (nowMs >= fullEnd) return { status: 'completed', endMs: fullEnd, day: lengthDays }
  return { status: 'active', endMs: null, day: journeyDay(attempt.startedAt, nowMs) }
}

/**
 * The last calendar day of an ended attempt: the day it was ended on, or for a
 * full run, `length` calendar days from the start ("1 Sep – 29 Nov · 90 days").
 */
function lastDay(attempt: JourneyAttempt, state: AttemptState, timeZone: string): DayKey {
  return attempt.endedAt ? dayKey(attempt.endedAt, timeZone) : addDays(dayKey(attempt.startedAt, timeZone), state.day - 1)
}

/** Whether the journey removes nicotine in any form (Today then shows the cravings lane). */
export const removesNicotine = (journey: Journey): boolean =>
  journey.rules.some(r => r.kind === 'remove' && /nicotine|snus|pouch|vap|smok|cigarette/i.test(r.label))

export const currentAttempt = (journey: Journey): JourneyAttempt | undefined => journey.attempts.at(-1)

/** Journeys with a running attempt, the longest-running first (sidebar order). */
export function climbingJourneys(journeys: readonly Journey[], nowMs: number): Journey[] {
  return journeys
    .filter((j) => {
      const attempt = currentAttempt(j)
      return attempt !== undefined && attemptState(attempt, j.lengthDays, nowMs).status === 'active'
    })
    .sort((a, b) => Date.parse(currentAttempt(a)!.startedAt) - Date.parse(currentAttempt(b)!.startedAt))
}

export function journeySummary(journey: Journey, nowMs: number): JourneySummary {
  const attempt = currentAttempt(journey)
  return { id: journey.id, name: journey.name, day: attempt ? journeyDay(attempt.startedAt, nowMs) : 1, color: JOURNEY_COLORS[journey.color] }
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** Every attempt as a date span, oldest first (Timeline lanes, Journal events). */
export function journeySpans(journeys: readonly Journey[], nowMs: number, timeZone: string): JourneySpan[] {
  return journeys.flatMap(j => j.attempts.map((attempt): JourneySpan => {
    const state = attemptState(attempt, j.lengthDays, nowMs)
    const status: JourneyStatus = state.status === 'paused' ? 'stopped' : state.status
    const statusLabel = {
      active: `Day ${state.day} · active`,
      completed: `Completed · ${plural(state.day, 'day')}`,
      setback: `${plural(state.day, 'day')} · setback`,
      stopped: `Stopped at day ${state.day}`,
    }[status]
    return {
      id: attempt.id,
      name: j.attempts.length > 1 ? `${j.name} · #${attempt.number}` : j.name,
      start: dayKey(attempt.startedAt, timeZone),
      end: state.endMs === null ? null : lastDay(attempt, state, timeZone),
      status,
      statusLabel,
    }
  })).sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
}

// ── Checkpoint track (Journeys list) ──────────────────────────────────
export interface TrackFloor {
  day: number
  /** "D3", or "SUMMIT" for the last floor. */
  label: string
  /** Position on the log-scaled track, 0–1. */
  x: number
  state: 'reached' | 'next' | 'future'
}

export interface CheckpointTrack {
  floors: TrackFloor[]
  /** Filled share of the track, 0–1. */
  progress: number
}

/** Floors on a log scale, so the early days (where most happens) get room. */
export function checkpointTrack(checkpoints: readonly number[], lengthDays: number, startedAt: string, nowMs: number): CheckpointTrack {
  const scale = (days: number) => Math.min(1, Math.log(days) / Math.log(lengthDays))
  const day = journeyDay(startedAt, nowMs)
  const next = checkpoints.find(d => d > day)
  const elapsedDays = Math.max(0, (nowMs - Date.parse(startedAt)) / DAY_MS)
  return {
    floors: checkpoints.map(d => ({
      day: d,
      label: d === lengthDays ? 'SUMMIT' : `D${d}`,
      x: scale(d),
      state: d <= day ? 'reached' : d === next ? 'next' : 'future',
    })),
    progress: scale(elapsedDays + 1),
  }
}

/** "1 day 23 hours", "5 hours 12 min", "12 min". */
export function formatCountdown(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days > 0) return `${plural(days, 'day')} ${plural(hours, 'hour')}`
  if (hours > 0) return `${plural(hours, 'hour')} ${minutes % 60} min`
  return `${minutes % 60} min`
}

/** "Next floor · Day 14, in 1 day 23 hours", or the time left at the summit. */
export function nextFloorText(checkpoints: readonly number[], lengthDays: number, startedAt: string, nowMs: number): string {
  const start = Date.parse(startedAt)
  const next = checkpoints.find(d => d > journeyDay(startedAt, nowMs))
  if (next === undefined) return `At the summit · completes in ${formatCountdown(start + lengthDays * DAY_MS - nowMs)}`
  return `Next floor · Day ${next}, in ${formatCountdown(start + (next - 1) * DAY_MS - nowMs)}`
}

// ── Mood around attempts ──────────────────────────────────────────────
export interface AttemptMood {
  attemptId: string
  beforeAverage: number | null
  beforeEntries: number
  duringAverage: number | null
  duringEntries: number
}

/** Fewer check-ins than this on either side and the comparison isn't shown. */
export const MIN_COMPARISON_ENTRIES = 3

/** Average mood during the attempt minus the 30 days before it, or null without enough check-ins. */
export function moodChange(mood: AttemptMood | undefined): number | null {
  if (!mood || mood.beforeAverage === null || mood.duringAverage === null) return null
  if (mood.beforeEntries < MIN_COMPARISON_ENTRIES || mood.duringEntries < MIN_COMPARISON_ENTRIES) return null
  return mood.duringAverage - mood.beforeAverage
}

/** "+0.5", "−0.3" (a real minus sign), "0.0", or "—" without data. */
export function formatChange(change: number | null): string {
  if (change === null) return '—'
  const rounded = Math.round(change * 10) / 10
  if (rounded > 0) return `+${rounded.toFixed(1)}`
  if (rounded < 0) return `−${Math.abs(rounded).toFixed(1)}`
  return '0.0'
}

export type ChangeTone = 'positive' | 'negative' | 'neutral'

export function changeTone(change: number | null): ChangeTone {
  const rounded = change === null ? 0 : Math.round(change * 10) / 10
  return rounded > 0 ? 'positive' : rounded < 0 ? 'negative' : 'neutral'
}

// ── Journeys list ─────────────────────────────────────────────────────
const dayMonth = (key: DayKey) => `${Number(key.slice(8, 10))} ${monthShort(Number(key.slice(5, 7)))}`

/**
 * "14–17 Aug", "28 Jul – 2 Aug"; with `year`: "1 – 30 Jun 2025",
 * "1 Sep – 29 Nov 2025", "28 Dec 2025 – 3 Jan 2026".
 */
export function formatDayRange(start: DayKey, end: DayKey, year = false): string {
  const sameMonth = start.slice(0, 7) === end.slice(0, 7)
  const sameYear = start.slice(0, 4) === end.slice(0, 4)
  const suffix = year ? ` ${end.slice(0, 4)}` : ''
  if (sameMonth) return `${Number(start.slice(8, 10))}${year ? ' – ' : '–'}${dayMonth(end)}${suffix}`
  if (year && !sameYear) return `${dayMonth(start)} ${start.slice(0, 4)} – ${dayMonth(end)}${suffix}`
  return `${dayMonth(start)} – ${dayMonth(end)}${suffix}`
}

const countRules = (journey: Journey, kind: RuleKind) => journey.rules.filter(r => r.kind === kind).length

/** "4 removed, 4 allowed" (parts with no rules are left out). */
export function rulesSummary(journey: Journey): string {
  const removed = countRules(journey, 'remove')
  const allowed = countRules(journey, 'allow')
  return [removed && `${removed} removed`, allowed && `${allowed} allowed`].filter(Boolean).join(', ')
}

export interface ClimbingRow {
  journey: Journey
  day: number
  /** "Attempt 2 · Started 24 Sep · 4 removed, 4 allowed". */
  meta: string
  track: CheckpointTrack
  next: string
  change: number | null
}

export function climbingRows(journeys: readonly Journey[], moods: ReadonlyMap<string, AttemptMood>, nowMs: number, timeZone: string): ClimbingRow[] {
  return climbingJourneys(journeys, nowMs).map((journey) => {
    const attempt = currentAttempt(journey)!
    return {
      journey,
      day: journeyDay(attempt.startedAt, nowMs),
      meta: [
        attempt.number > 1 && `Attempt ${attempt.number}`,
        `Started ${dayMonth(dayKey(attempt.startedAt, timeZone))}`,
        rulesSummary(journey),
      ].filter(Boolean).join(' · '),
      track: checkpointTrack(journey.checkpoints, journey.lengthDays, attempt.startedAt, nowMs),
      next: nextFloorText(journey.checkpoints, journey.lengthDays, attempt.startedAt, nowMs),
      change: moodChange(moods.get(attempt.id)),
    }
  })
}

export interface AttemptBar {
  number: number
  days: number
  /** Share of the longest bar, 0–1. */
  width: number
  active: boolean
  /** "4 days · 14–17 Aug" or "12 days and counting". */
  label: string
}

/** One bar per attempt, scaled to the longest run or the current attempt's next floor. */
export function attemptBars(journey: Journey, nowMs: number, timeZone: string): AttemptBar[] {
  const states = journey.attempts.map(a => ({ attempt: a, state: attemptState(a, journey.lengthDays, nowMs) }))
  const current = states.at(-1)
  const target = current?.state.status === 'active' ? journey.checkpoints.find(d => d > current.state.day) ?? 0 : 0
  const scale = Math.max(target, ...states.map(s => s.state.day))
  return states.map(({ attempt, state }) => {
    const active = state.status === 'active'
    const range = active ? '' : formatDayRange(dayKey(attempt.startedAt, timeZone), lastDay(attempt, state, timeZone))
    return {
      number: attempt.number,
      days: state.day,
      width: state.day / scale,
      active,
      label: active ? `${plural(state.day, 'day')} and counting` : `${plural(state.day, 'day')} · ${range}`,
    }
  })
}

const TIMES = ['', '', 'twice', 'three times', 'four times', 'five times', 'six times', 'seven times', 'eight times', 'nine times', 'ten times']

/** "Attempt #1 ended on Day 4. Attempt #2 is already three times as long." */
export function attemptsSummary(bars: readonly AttemptBar[]): string {
  const previous = bars.at(-2)
  const current = bars.at(-1)
  if (!previous || !current) return ''
  const ended = `Attempt #${previous.number} ended on Day ${previous.days}.`
  const ratio = Math.floor(current.days / previous.days)
  const verb = current.active ? 'is already' : 'was'
  if (ratio >= 2) return `${ended} Attempt #${current.number} ${verb} ${TIMES[ratio] ?? `${ratio} times`} as long.`
  if (current.days > previous.days) return `${ended} Attempt #${current.number} ${current.active ? 'has already lasted' : 'lasted'} longer.`
  return current.active ? `${ended} Attempt #${current.number} is on Day ${current.days}.` : ended
}

export interface PastRow {
  /** The attempt's id. */
  id: string
  journeyId: string
  /** "Read every day", or "Nicotine-free · Attempt 1" when there were several. */
  name: string
  /** "1 Sep – 29 Nov 2025 · 90 days". */
  dates: string
  /** "Completed", "Paused on Day 8", "Setback, Day 4". */
  status: string
  completed: boolean
  change: number | null
}

/** Attempts that have ended, most recent first ("Behind you"). */
export function pastRows(journeys: readonly Journey[], moods: ReadonlyMap<string, AttemptMood>, nowMs: number, timeZone: string): PastRow[] {
  return journeys
    .flatMap(j => j.attempts.map(a => ({ j, a, state: attemptState(a, j.lengthDays, nowMs) })))
    .filter(({ state }) => state.status !== 'active')
    .sort((x, y) => y.state.endMs! - x.state.endMs!)
    .map(({ j, a, state }) => {
      const start = dayKey(a.startedAt, timeZone)
      const end = lastDay(a, state, timeZone)
      return {
        id: a.id,
        journeyId: j.id,
        name: j.attempts.length > 1 ? `${j.name} · Attempt ${a.number}` : j.name,
        dates: `${formatDayRange(start, end, true)} · ${plural(state.day, 'day')}`,
        status: { completed: 'Completed', paused: `Paused on Day ${state.day}`, setback: `Setback, Day ${state.day}`, active: '' }[state.status],
        completed: state.status === 'completed',
        change: moodChange(moods.get(a.id)),
      }
    })
}
