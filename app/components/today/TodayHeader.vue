<script setup lang="ts">
import type { MoodEntry } from '~/types/mood'
import { formatDayline, formatElapsed, greeting, zonedParts } from '~/utils/date'
import { getMood } from '~/utils/mood'

const props = defineProps<{
  now: number
  timeZone: string
  firstName: string
  lastEntry: MoodEntry | null
}>()

const title = computed(() => `${greeting(zonedParts(props.now, props.timeZone).hour)}, ${props.firstName}.`)

const lastCheckIn = computed(() => {
  const e = props.lastEntry
  return e ? `${formatElapsed(Date.parse(e.loggedAt), props.now)} · ${getMood(e.level).label}` : '—'
})
</script>

<template>
  <PageHeader
    class="today-header"
    variant="sans"
    :eyebrow="formatDayline(now, timeZone)"
    :title="title"
  >
    <template #actions>
      <span class="today-header__last">Last check-in {{ lastCheckIn }}</span>
      <!-- No search palette is designed yet; ⌘K opens the Journal for now (PLAN.md Q5). -->
      <NuxtLink
        to="/journal#search"
        class="search-button"
        aria-keyshortcuts="Meta+K Control+K"
      >
        Search entries
        <KeyHint variant="boxed">⌘K</KeyHint>
      </NuxtLink>
    </template>
  </PageHeader>
</template>
