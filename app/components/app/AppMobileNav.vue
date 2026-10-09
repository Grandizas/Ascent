<script setup lang="ts">
import { isNavActive, PRIMARY_NAV } from '~/utils/navigation'

const route = useRoute()
const tabs = PRIMARY_NAV.filter(item => item.mobileIcon)

// Journey detail pages still belong to the Journeys tab on mobile.
function isActive(to: string) {
  return to === '/journeys' ? route.path.startsWith('/journeys') : isNavActive({ to }, route.path)
}
</script>

<template>
  <nav
    class="mobile-nav"
    aria-label="Main"
  >
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="mobile-nav__tab"
      :class="{ 'is-active': isActive(tab.to) }"
      :aria-current="isActive(tab.to) ? 'page' : undefined"
    >
      <span
        class="mobile-nav__icon"
        :class="{ 'is-today': tab.to === '/' }"
      >
        <AppIcon :name="tab.mobileIcon!" />
      </span>
      {{ tab.label }}
    </NuxtLink>
  </nav>
</template>
