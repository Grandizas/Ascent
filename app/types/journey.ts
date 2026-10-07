import type { DayKey } from '~/utils/date'

/** Minimal journey shape the shell needs. Extended in phase 6. */
export interface JourneySummary {
  id: string
  name: string
  /** Current day of the active attempt (1-based). */
  day: number
  /** Dot color in lists (any CSS color). */
  color: string
}

export type JourneyStatus = 'active' | 'completed' | 'stopped' | 'setback'

/** One attempt of a journey as a date span (Timeline lanes and markers). */
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
