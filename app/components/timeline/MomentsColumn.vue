<script setup lang="ts">
import type { MoodEntry } from '~/types/mood'
import { dayKey, formatMonthDay, formatTime } from '~/utils/date'
import { getMood } from '~/utils/mood'

const props = defineProps<{
  title: string
  /** "Last 30 days", "Today"… */
  periodLabel: string
  entries: readonly MoodEntry[]
  timeZone: string
  /** Show the date before the time (anything longer than a day). */
  withDate: boolean
}>()

const when = (entry: MoodEntry) => {
  const time = formatTime(entry.loggedAt, props.timeZone)
  return props.withDate ? `${formatMonthDay(dayKey(entry.loggedAt, props.timeZone))} · ${time}` : time
}
</script>

<template>
  <section class="moments-column">
    <div class="moments-column__head">
      <h2 class="moments-column__title">
        {{ title }}
      </h2>
      <span class="moments-column__period">{{ periodLabel }}</span>
    </div>
    <article
      v-for="entry in entries"
      :key="entry.id"
      class="moments-column__item"
    >
      <div class="moments-column__row">
        <span class="moments-column__when">{{ when(entry) }}</span>
        <span class="moments-column__score">
          <MoodDot :level="entry.level" />
          {{ entry.score }}/10
          <span class="visually-hidden">{{ getMood(entry.level).label }}</span>
        </span>
      </div>
      <p class="moments-column__quote">
        “{{ entry.note.trim() }}”
      </p>
      <span
        v-if="entry.tags.length"
        class="moments-column__tags"
      >{{ entry.tags.join(' · ') }}</span>
    </article>
    <p
      v-if="!entries.length"
      class="moments-column__empty"
    >
      No notes in this period.
    </p>
  </section>
</template>
