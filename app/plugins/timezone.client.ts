import { browserTimeZone, TIMEZONE_COOKIE } from '~/composables/useTimezone'

// If the server rendered in a different timezone than the browser's (first
// visit, or travel), store the browser zone and reload once so server and
// client agree on "today" and on every HH:MM. Skipped when the user picked a
// zone in Settings: then the profile decides, on server and client alike.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    if (useProfile().profile.value?.timezoneAuto === false) return
    const timeZone = useTimezone()
    const browserZone = browserTimeZone()
    if (!browserZone || browserZone === timeZone.value) return

    document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(browserZone)}; path=/; max-age=31536000; samesite=lax`

    // Without cookies a reload would loop; switch on the client instead.
    const guard = 'tz-reloaded'
    if (sessionStorage.getItem(guard) === browserZone) {
      timeZone.value = browserZone
      return
    }
    sessionStorage.setItem(guard, browserZone)
    reloadNuxtApp({ force: true })
  })
})
