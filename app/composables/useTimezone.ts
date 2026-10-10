import { isValidTimeZone } from '~/utils/date'

export const TIMEZONE_COOKIE = 'tz'

/**
 * The user's IANA timezone. By default it follows the browser: the server can
 * only know that from a cookie, which the client sets on first visit
 * (plugins/timezone.client.ts). A zone picked in Settings replaces it once the
 * profile loads (layouts/default.vue).
 */
export function useTimezone() {
  const cookie = useCookie<string | null>(TIMEZONE_COOKIE)
  return useState('timezone', () => (isValidTimeZone(cookie.value) ? cookie.value : 'UTC'))
}

/** The browser's own zone, or null where there is none (server, odd runtimes). */
export function browserTimeZone(): string | null {
  if (import.meta.server) return null
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return isValidTimeZone(zone) ? zone : null
}
