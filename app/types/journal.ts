import type { MoodEntry } from '~/types/mood'
import type { DayKey } from '~/utils/date'
import type { MoodLevel } from '~/utils/mood'

/** A "Write something longer" entry. Matches the `journal_entries` row. */
export interface LongEntry {
  id: string
  /** ISO timestamp. */
  writtenAt: string
  body: string
}

export interface JournalFilters {
  /** Free-text search over notes and longer entries ('' = none). */
  query: string
  tag: string | null
  level: MoodLevel | null
  /** "With notes" (true) or "Every check-in" (false). */
  notesOnly: boolean
}

/** One item of a feed day. `matches` is false for items only kept for the day summary. */
export type FeedItem
  = | { kind: 'check-in', entry: MoodEntry, matches: boolean }
    | { kind: 'long', entry: LongEntry, matches: boolean }

/** Everything recorded on one local day, oldest first. */
export interface FeedDay {
  day: DayKey
  items: FeedItem[]
}

/** Check-in totals for a calendar month ("YYYY-MM"). */
export interface JournalMonth {
  month: string
  entries: number
  notes: number
  average: number
}

export interface TagCount {
  tag: string
  count: number
}
