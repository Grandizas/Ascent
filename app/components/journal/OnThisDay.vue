<script setup lang="ts">
import type { Memory } from '~/utils/analytics/journal'
import { formatTime } from '~/utils/date'
import { getMood } from '~/utils/mood'

defineProps<{
  memories: readonly Memory[]
  timeZone: string
}>()
</script>

<template>
  <BaseCard
    class="on-this-day"
    pad="sm"
    aria-labelledby="on-this-day-label"
  >
    <SectionLabel id="on-this-day-label">
      On this day
    </SectionLabel>
    <div class="on-this-day__grid">
      <figure
        v-for="{ year, entry } in memories"
        :key="entry.id"
        class="on-this-day__memory"
      >
        <figcaption class="on-this-day__meta">
          <span class="on-this-day__year">{{ year }}</span>
          · {{ formatTime(entry.loggedAt, timeZone) }} · {{ getMood(entry.level).label }} {{ entry.score }}/10
        </figcaption>
        <blockquote class="on-this-day__quote">
          “{{ entry.note }}”
        </blockquote>
      </figure>
    </div>
  </BaseCard>
</template>
