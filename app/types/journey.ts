import type { DayKey } from '~/utils/date'
import type { JourneyColor } from '~/utils/journey'

export type RuleKind = 'remove' | 'allow'

/** One approved rule ("Nicotine" removed, "Coffee" allowed). */
export interface JourneyRule {
  kind: RuleKind
  label: string
  /** Offered by the app rather than read from the user's text. */
  suggested: boolean
}

export type AttemptEndReason = 'setback' | 'paused' | 'completed'

/** continued — the attempt kept running · restarted — it ended and the next began. */
export type SetbackOutcome = 'continued' | 'restarted'

export interface JourneySetback {
  id: string
  occurredAt: string
  note: string
  outcome: SetbackOutcome
}

export interface JourneyAttempt {
  id: string
  number: number
  /** ISO timestamp; Day N opens (N − 1) × 24 h after it. */
  startedAt: string
  endedAt: string | null
  endReason: AttemptEndReason | null
  /** Oldest first. */
  setbacks: JourneySetback[]
}

/** A journey with its rules and attempts. Matches the `journeys` row and its children. */
export interface Journey {
  id: string
  name: string
  /** Step 1, in the user's words. */
  what: string
  /** Step 2, in the user's words. */
  why: string
  whyWrittenAt: string
  lengthDays: number
  /** Floors kept in the wizard, ascending; always includes 1 and the length. */
  checkpoints: number[]
  color: JourneyColor
  createdAt: string
  rules: JourneyRule[]
  /** Oldest first; the last one is the current attempt. */
  attempts: JourneyAttempt[]
}

/** Minimal journey shape the shell needs (sidebar, composer label). */
export interface JourneySummary {
  id: string
  name: string
  /** Current day of the active attempt (1-based). */
  day: number
  /** Dot color in lists (any CSS color). */
  color: string
}

export type JourneyStatus = 'active' | 'completed' | 'stopped' | 'setback'

/** One attempt of a journey as a date span (Timeline lanes and markers, Journal events). */
export interface JourneySpan {
  id: string
  name: string
  /** First day, in the user's timezone. */
  start: DayKey
  /** Last day; null while still running. */
  end: DayKey | null
  status: JourneyStatus
  /** e.g. "Day 12 · active", "Completed · 90 days". */
  statusLabel: string
}
