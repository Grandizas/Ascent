<script setup lang="ts">
import type { MoodEntry } from '~/types/mood'

defineProps<{
  /** Newest first. */
  entries: readonly MoodEntry[]
  timeZone: string
}>()
</script>

<template>
  <section
    class="recent-moments"
    aria-labelledby="recent-moments-label"
  >
    <div class="recent-moments__head">
      <SectionLabel
        id="recent-moments-label"
        size="md"
      >
        Recent moments
      </SectionLabel>
      <NuxtLink
        to="/journal"
        class="text-link"
      >
        Journal
        <AppIcon name="arrow-right" />
      </NuxtLink>
    </div>
    <MomentRow
      v-for="entry in entries"
      :key="entry.id"
      :entry="entry"
      :time-zone="timeZone"
    />
    <p
      v-if="!entries.length"
      class="recent-moments__empty"
    >
      Nothing logged yet today. Tap how you feel to start.
    </p>
  </section>
</template>
