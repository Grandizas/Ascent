<script setup lang="ts">
import { PRIMARY_NAV, SETTINGS_NAV } from '~/utils/navigation'

// Global navigation shortcuts, shown as keycaps in the sidebar.
const go = (to: string) => () => navigateTo(to)
useHotkeys({
  ...Object.fromEntries([...PRIMARY_NAV, SETTINGS_NAV].map(item => [item.shortcut, go(item.to)])),
  'shift+q': go('/login'),
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
