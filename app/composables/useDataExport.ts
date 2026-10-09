import { checkInsCsv, downloadFile, exportFileName } from '~/utils/dataExport'
import { dayKey } from '~/utils/date'
import { MOOD_COLUMNS, type MoodRow } from '~/utils/moodRow'

/** Supabase returns at most this many rows per request. */
const PAGE = 1000

/** Every user table, with the column that orders it. RLS limits each to the user's own rows. */
const TABLES = [
  ['mood_entries', 'logged_at'],
  ['journal_entries', 'written_at'],
  ['journeys', 'created_at'],
  ['journey_rules', 'created_at'],
  ['journey_attempts', 'started_at'],
  ['journey_setbacks', 'occurred_at'],
] as const

type Table = typeof TABLES[number][0]

/**
 * "Export everything" in Settings. Runs in the browser with the user's own
 * session, so it can only ever read what RLS lets this user read.
 */
export function useDataExport() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { profile } = useProfile()
  const timeZone = useTimezone()

  async function fetchAll(table: Table, orderBy: string, columns = '*'): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = []
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .order(orderBy)
        .order('id')
        .range(offset, offset + PAGE - 1)
      if (error) throw error
      rows.push(...(data as unknown as Record<string, unknown>[]))
      if (data.length < PAGE) return rows
    }
  }

  const today = () => dayKey(new Date(), timeZone.value)

  /** Everything as one JSON file: profile, check-ins, journal and journeys. */
  async function exportJson() {
    const tables = await Promise.all(TABLES.map(async ([table, orderBy]) => [table, await fetchAll(table, orderBy)] as const))
    const data = {
      app: 'Ascent',
      exported_at: new Date().toISOString(),
      account: { email: user.value?.email ?? null },
      profile: profile.value && {
        display_name: profile.value.displayName,
        timezone: profile.value.timezone,
        timezone_follows_device: profile.value.timezoneAuto,
        tags: profile.value.tags,
        created_at: profile.value.createdAt,
      },
      ...Object.fromEntries(tables),
    }
    downloadFile(exportFileName(today(), 'json'), JSON.stringify(data, null, 2), 'application/json')
  }

  /** Check-ins only, as a spreadsheet-friendly CSV. */
  async function exportCheckInsCsv() {
    const rows = await fetchAll('mood_entries', 'logged_at', MOOD_COLUMNS) as unknown as MoodRow[]
    downloadFile(exportFileName(today(), 'csv'), checkInsCsv(rows, timeZone.value), 'text/csv;charset=utf-8')
  }

  return { exportJson, exportCheckInsCsv }
}
