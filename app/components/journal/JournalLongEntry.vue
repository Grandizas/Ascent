<script setup lang="ts">
import type { LongEntry } from '~/types/journal'
import { formatTime } from '~/utils/date'

defineProps<{
  entry: LongEntry
  timeZone: string
}>()
</script>

<template>
  <div class="journal-long-entry">
    <span class="journal-long-entry__meta">{{ formatTime(entry.writtenAt, timeZone) }} · Longer entry</span>
    <!-- v-text: no template whitespace around the body, which keeps its own line breaks. -->
    <p
      class="journal-long-entry__body"
      v-text="entry.body"
    />
  </div>
</template>
