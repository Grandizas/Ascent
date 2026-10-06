<script setup lang="ts">
import { isNavActive, PRIMARY_NAV, SETTINGS_NAV } from '~/utils/navigation'

const route = useRoute()
const journeys = useActiveJourneys()
const { profile, initials, memberSinceLabel } = useProfile()
</script>

<template>
  <aside class="sidebar">
    <AppBrand class="sidebar__brand" />

    <nav
      class="sidebar__nav"
      aria-label="Main"
    >
      <AppNavItem
        v-for="item in PRIMARY_NAV"
        :key="item.to"
        :to="item.to"
        :label="item.label"
        :shortcut="item.shortcut"
        :active="isNavActive(item, route.path)"
      />
    </nav>

    <section
      v-if="journeys.length"
      class="sidebar__journeys"
      aria-labelledby="sidebar-journeys-label"
    >
      <span
        id="sidebar-journeys-label"
        class="sidebar__journeys-label"
      >Active journeys</span>
      <!-- The first journey's dot glows, as in the design. -->
      <NuxtLink
        v-for="(journey, index) in journeys"
        :key="journey.id"
        :to="`/journeys/${journey.id}`"
        class="sidebar__journey"
        :class="{ 'is-active': route.path === `/journeys/${journey.id}` }"
      >
        <MoodDot
          :color="journey.color"
          :size="6"
          :glow="index === 0"
        />
        <span class="sidebar__journey-name">{{ journey.name }}</span>
        <span class="sidebar__journey-day">D{{ journey.day }}</span>
      </NuxtLink>
    </section>

    <div class="sidebar__footer">
      <AppNavItem
        :to="SETTINGS_NAV.to"
        :label="SETTINGS_NAV.label"
        :shortcut="SETTINGS_NAV.shortcut"
        :active="isNavActive(SETTINGS_NAV, route.path)"
      />
      <div class="sidebar__user">
        <AppAvatar :initials="initials" />
        <div class="sidebar__user-text">
          <span class="sidebar__user-name">{{ profile.displayName }}</span>
          <span class="sidebar__user-since">{{ memberSinceLabel }}</span>
        </div>
      </div>
      <AppNavItem
        to="/login"
        label="Sign out"
        shortcut="⇧Q"
        muted
      />
    </div>
  </aside>
</template>
