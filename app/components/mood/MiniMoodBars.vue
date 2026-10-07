<script setup lang="ts">
import type { MoodEntry } from '~/types/mood'
import { getMood } from '~/utils/mood'

defineProps<{
  /** One bar per check-in, in time order. */
  entries: readonly Pick<MoodEntry, 'id' | 'level' | 'score'>[]
}>()
</script>

<template>
  <div
    class="mini-mood-bars"
    aria-hidden="true"
  >
    <span
      v-for="entry in entries"
      :key="entry.id"
      class="mini-mood-bars__bar"
      :style="{ '--bar-height': `${4 + entry.score * 1.8}px`, '--bar-color': getMood(entry.level).color }"
    />
  </div>
</template>
