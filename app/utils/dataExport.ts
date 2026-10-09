// "Export everything" (Settings): file names and the check-ins CSV.

import { type DayKey, dayKey, formatTime } from '~/utils/date'
import { getMood, type MoodLevel } from '~/utils/mood'
import type { MoodRow } from '~/utils/moodRow'

export function exportFileName(today: DayKey, extension: 'json' | 'csv'): string {
  return extension === 'json' ? `ascent-export-${today}.json` : `ascent-check-ins-${today}.csv`
}

/**
 * One CSV cell. Quotes when needed, and prefixes cells a spreadsheet would
 * read as a formula (=, +, -, @) with an apostrophe.
 */
export function csvCell(value: string | number): string {
  let text = String(value)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/** Byte-order mark: tells spreadsheet apps the file is UTF-8. */
const BOM = String.fromCharCode(0xFEFF)

const CHECK_IN_HEADER = ['date', 'time', 'mood', 'intensity', 'tags', 'note', 'logged_at_utc']

/**
 * Check-ins as CSV, one row each, with the date and time in `timeZone`.
 */
export function checkInsCsv(rows: readonly MoodRow[], timeZone: string): string {
  const lines = rows.map(row => [
    dayKey(row.logged_at, timeZone),
    formatTime(row.logged_at, timeZone),
    getMood(row.level as MoodLevel).label,
    row.score,
    row.tags.join('; '),
    row.note,
    new Date(row.logged_at).toISOString(),
  ].map(csvCell).join(','))
  return `${BOM}${[CHECK_IN_HEADER.join(','), ...lines].join('\r\n')}\r\n`
}

/** Saves `content` as a file through the browser's download. Client only. */
export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.append(link)
  link.click()
  link.remove()
  // Some browsers start the download asynchronously.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
