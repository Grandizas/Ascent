import { TIMEZONE_COOKIE } from '~/composables/useTimezone'

// If the server rendered in a different timezone than the browser's (first
// visit, or travel), store the browser zone and reload once so server and
// client agree on "today" and on every HH:MM.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    const timeZone = useTimezone()
    const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone
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
