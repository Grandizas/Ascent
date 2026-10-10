// Timezone choices for Settings.

export interface TimeZoneOption {
  value: string
  /** "(GMT+1) Europe / London" */
  label: string
}

/** Minutes east of UTC for `timeZone` at `at` (e.g. 60 for London in summer). */
export function timeZoneOffset(timeZone: string, at: Date): number {
  const name = new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(at)
    .find(part => part.type === 'timeZoneName')?.value ?? 'GMT'
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name)
  if (!match) return 0
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0)
  return match[1] === '-' ? -minutes : minutes
}

/** "GMT", "GMT+1", "GMT-3:30". */
export function formatOffset(minutes: number): string {
  if (!minutes) return 'GMT'
  const abs = Math.abs(minutes)
  const hours = Math.floor(abs / 60)
  const rest = abs % 60
  return `GMT${minutes < 0 ? '-' : '+'}${hours}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`
}

/** "America/Argentina/Buenos_Aires" → "America / Argentina / Buenos Aires". */
export function timeZoneName(timeZone: string): string {
  return timeZone.replaceAll('_', ' ').split('/').join(' / ')
}

export function timeZoneLabel(timeZone: string, at: Date): string {
  return `(${formatOffset(timeZoneOffset(timeZone, at))}) ${timeZoneName(timeZone)}`
}

/**
 * Every zone the runtime knows, west to east, then by name. `include` adds
 * zones the list may lack (e.g. "UTC" or the stored one) so the select can
 * always show the current value.
 */
export function timeZoneOptions(at: Date, include: readonly string[] = [], zones: readonly string[] = Intl.supportedValuesOf('timeZone')): TimeZoneOption[] {
  const all = [...new Set([...zones, ...include.filter(Boolean)])]
  return all
    .map(value => ({ value, offset: timeZoneOffset(value, at) }))
    .sort((a, b) => a.offset - b.offset || a.value.localeCompare(b.value))
    .map(({ value, offset }) => ({ value, label: `(${formatOffset(offset)}) ${timeZoneName(value)}` }))
}
