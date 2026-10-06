import type { MoodLevel } from '~/utils/mood'

/** One check-in. Shape matches the planned `mood_entries` row (+ tag names). */
export interface MoodEntry {
  id: string
  /** ISO timestamp; captured automatically when logging. */
  loggedAt: string
  /** The mood the user tapped. */
  level: MoodLevel
  /** Intensity 1–10. */
  score: number
  /** Optional; '' when empty. */
  note: string
  tags: string[]
}

export type MoodEntryPatch = Partial<Pick<MoodEntry, 'level' | 'score' | 'note' | 'tags'>>
