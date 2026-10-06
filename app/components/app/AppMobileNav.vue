<script setup lang="ts">
import { isNavActive, PRIMARY_NAV } from '~/utils/navigation'

const route = useRoute()
const tabs = PRIMARY_NAV.filter(item => item.mobileGlyph)

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
      <!-- Glyphs are drawn in CSS, as in the design. -->
      <span
        class="mobile-nav__icon"
        aria-hidden="true"
      >
        <span :class="`mobile-nav__glyph mobile-nav__glyph--${tab.mobileGlyph}`" />
      </span>
      {{ tab.label }}
    </NuxtLink>
  </nav>
</template>
