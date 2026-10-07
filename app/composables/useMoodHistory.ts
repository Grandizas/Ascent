import type { MoodEntry } from '~/types/mood'
import { addDays, type DayKey, zonedDate } from '~/utils/date'
import { MOOD_COLUMNS, toMoodEntry } from '~/utils/moodRow'

/** Supabase returns at most this many rows per request. */
const PAGE = 1000

/**
 * Read-only queries over the user's whole history (Timeline, later Insights
 * and Year review). Results aren't shared state: each page loads what it shows.
 */
export function useMoodHistory() {
  const supabase = useSupabaseClient()

  /** Entries from the start of `from` to the end of `to` (inclusive days in `timeZone`), oldest first. */
  async function fetchRange(from: DayKey, to: DayKey, timeZone: string): Promise<MoodEntry[]> {
    const start = zonedDate(from, 0, timeZone).toISOString()
    const end = zonedDate(addDays(to, 1), 0, timeZone).toISOString()
    const entries: MoodEntry[] = []
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await supabase
        .from('mood_entries')
        .select(MOOD_COLUMNS)
        .gte('logged_at', start)
        .lt('logged_at', end)
        .order('logged_at')
        .order('id')
        .range(offset, offset + PAGE - 1)
      if (error) throw error
      entries.push(...data.map(toMoodEntry))
      if (data.length < PAGE) return entries
    }
  }

  /** Total number of check-ins and when the first one was logged. */
  async function fetchOverview(): Promise<{ total: number, firstLoggedAt: string | null }> {
    const [count, first] = await Promise.all([
      supabase.from('mood_entries').select('id', { count: 'exact', head: true }),
      supabase.from('mood_entries').select('logged_at').order('logged_at').limit(1).maybeSingle(),
    ])
    if (count.error) throw count.error
    if (first.error) throw first.error
    return { total: count.count ?? 0, firstLoggedAt: first.data?.logged_at ?? null }
  }

  return { fetchRange, fetchOverview }
}
