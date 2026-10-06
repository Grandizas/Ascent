<script setup lang="ts">
import type { MoodEntry } from '~/types/mood'
import { formatTime } from '~/utils/date'
import { getMood } from '~/utils/mood'

const props = defineProps<{
  entry: MoodEntry
  timeZone: string
}>()

const mood = computed(() => getMood(props.entry.level))
</script>

<template>
  <div class="moment-row">
    <span class="moment-row__time">{{ formatTime(entry.loggedAt, timeZone) }}</span>
    <span class="moment-row__mood">
      <MoodDot :color="mood.color" />
      {{ mood.label }}
    </span>
    <div class="moment-row__text">
      <span class="moment-row__note">{{ entry.note || '—' }}</span>
      <span
        v-if="entry.tags.length"
        class="moment-row__tags"
      >{{ entry.tags.join(' · ') }}</span>
    </div>
    <span class="moment-row__score">{{ entry.score }}/10</span>
  </div>
</template>
