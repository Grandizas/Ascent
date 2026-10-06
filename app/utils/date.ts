// Timezone-aware date helpers. Every "which day / what time" question is
// answered in the user's IANA timezone, never the server's.

/** Calendar day in the user's timezone, `YYYY-MM-DD`. */
export type DayKey = string

export interface ZonedParts {
  year: number
  month: number // 1–12
  day: number
  hour: number
  minute: number
  weekday: string // "Monday"
}

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'long',
    })
    formatters.set(timeZone, formatter)
  }
  return formatter
}

export function isValidTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== 'string' || !timeZone) return false
  try {
    formatterFor(timeZone)
    return true
  }
  catch {
    return false
  }
}

export function zonedParts(date: Date | number, timeZone: string): ZonedParts {
  const parts = Object.fromEntries(
    formatterFor(timeZone).formatToParts(date).map(p => [p.type, p.value]),
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: String(parts.weekday),
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

export function dayKey(date: Date | number | string, timeZone: string): DayKey {
  const p = zonedParts(new Date(date), timeZone)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

/** Minutes since local midnight (0–1439). */
export function minuteOfDay(date: Date | number | string, timeZone: string): number {
  const p = zonedParts(new Date(date), timeZone)
  return p.hour * 60 + p.minute
}

/** `HH:MM` for minutes since midnight. */
export function formatClock(minutes: number): string {
  return `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`
}

export function formatTime(date: Date | number | string, timeZone: string): string {
  return formatClock(minuteOfDay(date, timeZone))
}

export function addDays(key: DayKey, days: number): DayKey {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** Offset of `timeZone` from UTC at `date`, in minutes (e.g. +60 for BST). */
function offsetMinutes(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
  const floored = Math.floor(date.getTime() / 60_000) * 60_000
  return (asUtc - floored) / 60_000
}

/** The instant at `minute` past midnight on `key`, in `timeZone`. */
export function zonedDate(key: DayKey, minute: number, timeZone: string): Date {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number]
  const guess = Date.UTC(y, m - 1, d, 0, minute)
  const first = offsetMinutes(new Date(guess), timeZone)
  const second = offsetMinutes(new Date(guess - first * 60_000), timeZone)
  return new Date(guess - second * 60_000)
}

/** "Monday · 5 October 2026 · 20:43" (rendered uppercase by the eyebrow style). */
export function formatDayline(date: Date | number, timeZone: string): string {
  const p = zonedParts(date, timeZone)
  const month = new Date(Date.UTC(2000, p.month - 1, 1)).toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })
  return `${p.weekday} · ${p.day} ${month} ${p.year} · ${pad(p.hour)}:${pad(p.minute)}`
}

export function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** "just now", "12m ago", "2h 1m ago", "3d ago". */
export function formatElapsed(fromMs: number, toMs: number): string {
  const minutes = Math.max(0, Math.floor((toMs - fromMs) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`
  return `${Math.floor(minutes / (24 * 60))}d ago`
}
