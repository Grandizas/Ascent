import type { FeedDay, JournalFilters, JournalMonth, LongEntry, TagCount } from '~/types/journal'
import { feedDays, JOURNAL_PAGE_DAYS } from '~/utils/analytics/journal'
import type { DayKey } from '~/utils/date'

/**
 * Journal data. The feed is built by the `journal_feed` database function, so
 * filtering and grouping by local day happen in one place for every page.
 */
export function useJournal() {
  const supabase = useSupabaseClient()

  /** The next page of days with something matching `filters`, newest first, before `before` (exclusive). */
  async function fetchFeed(filters: JournalFilters, timeZone: string, before: DayKey | null = null): Promise<{ days: FeedDay[], hasMore: boolean }> {
    const { data, error } = await supabase.rpc('journal_feed', {
      p_time_zone: timeZone,
      p_before: before ?? undefined,
      // One extra day tells whether "Show earlier days" has anything to show.
      p_days: JOURNAL_PAGE_DAYS + 1,
      p_query: filters.query.trim(),
      p_tag: filters.tag ?? undefined,
      p_level: filters.level ?? undefined,
      p_notes_only: filters.notesOnly,
    })
    if (error) throw error
    const days = feedDays(data)
    return { days: days.slice(0, JOURNAL_PAGE_DAYS), hasMore: days.length > JOURNAL_PAGE_DAYS }
  }

  /** Check-in totals per month, oldest first. */
  async function fetchMonths(timeZone: string): Promise<JournalMonth[]> {
    const { data, error } = await supabase.rpc('journal_months', { p_time_zone: timeZone })
    if (error) throw error
    return data.map(row => ({ month: row.month.slice(0, 7), entries: row.entries, notes: row.notes, average: Number(row.average) }))
  }

  /** The most used tags on noted check-ins. */
  async function fetchTags(limit = 7): Promise<TagCount[]> {
    const { data, error } = await supabase.rpc('journal_tags', { p_limit: limit })
    if (error) throw error
    return data.map(row => ({ tag: row.tag, count: row.entries }))
  }

  async function addLongEntry(body: string): Promise<LongEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ body: body.trim() })
      .select('id, written_at, body')
      .single()
    if (error) throw error
    return { id: data.id, writtenAt: new Date(data.written_at).toISOString(), body: data.body }
  }

  return { fetchFeed, fetchMonths, fetchTags, addLongEntry }
}
