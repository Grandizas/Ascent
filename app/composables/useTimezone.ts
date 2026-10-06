import { isValidTimeZone } from '~/utils/date'

export const TIMEZONE_COOKIE = 'tz'

/**
 * The user's IANA timezone. The server can only know it from a cookie, which
 * the client sets on first visit (plugins/timezone.client.ts). Moves to the
 * profile in phase 3.
 */
export function useTimezone() {
  const cookie = useCookie<string | null>(TIMEZONE_COOKIE)
  return useState('timezone', () => (isValidTimeZone(cookie.value) ? cookie.value : 'UTC'))
}
