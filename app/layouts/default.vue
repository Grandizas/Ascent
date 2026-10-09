<script setup lang="ts">
import { browserTimeZone } from '~/composables/useTimezone'
import { PRIMARY_NAV, SETTINGS_NAV } from '~/utils/navigation'

const { profile, load, update } = useProfile()
const { load: loadJourneys } = useJourneys()
const { signOut } = useAuth()

await Promise.all([
  useAsyncData('profile', () => load()),
  useAsyncData('journeys', () => loadJourneys()),
])

// A zone picked in Settings wins over the browser's. Pages render after this,
// so every "today" on the server and client uses it.
const timeZone = useTimezone()
if (profile.value && !profile.value.timezoneAuto) timeZone.value = profile.value.timezone

// Otherwise keep the stored timezone in step with the browser (first visit,
// travel), so server-side analytics agree with what the user sees.
onMounted(() => {
  const browserZone = browserTimeZone()
  if (profile.value?.timezoneAuto && browserZone && profile.value.timezone !== browserZone) {
    update({ timezone: browserZone }).catch(error => console.error('[profile] timezone sync failed', error))
  }
})

// Global navigation shortcuts, shown as keycaps in the sidebar.
const go = (to: string) => () => navigateTo(to)
useHotkeys({
  ...Object.fromEntries([...PRIMARY_NAV, SETTINGS_NAV].map(item => [item.shortcut, go(item.to)])),
  'shift+q': () => signOut(),
})
</script>

<template>
  <div class="shell">
    <AppSidebar />
    <main class="shell__main">
      <AppMobileTopBar />
      <slot />
    </main>
    <AppMobileNav />
  </div>
</template>
