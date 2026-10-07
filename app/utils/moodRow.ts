import type { Database } from '~/types/database.types'
import type { MoodEntry } from '~/types/mood'
import type { MoodLevel } from '~/utils/mood'

export type MoodRow = Pick<Database['public']['Tables']['mood_entries']['Row'], 'id' | 'logged_at' | 'level' | 'score' | 'note' | 'tags'>

/** Columns selected wherever entries are read. */
export const MOOD_COLUMNS = 'id, logged_at, level, score, note, tags'

export const toMoodEntry = (row: MoodRow): MoodEntry => ({
  id: row.id,
  loggedAt: new Date(row.logged_at).toISOString(),
  level: row.level as MoodLevel,
  score: row.score,
  note: row.note,
  tags: row.tags,
})
