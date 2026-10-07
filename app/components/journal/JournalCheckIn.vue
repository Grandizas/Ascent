<script setup lang="ts">
import type { MoodEntry } from '~/types/mood'
import { formatTime } from '~/utils/date'
import { getMood } from '~/utils/mood'

const props = defineProps<{
  entry: MoodEntry
  timeZone: string
}>()

const emit = defineEmits<{ tag: [tag: string] }>()

const mood = computed(() => getMood(props.entry.level))
</script>

<template>
  <div
    class="journal-check-in"
    :class="{ 'is-quiet': !entry.note }"
  >
    <span class="journal-check-in__time">{{ formatTime(entry.loggedAt, timeZone) }}</span>
    <div class="journal-check-in__body">
      <span
        class="journal-check-in__mood"
        :style="{ '--mood': mood.color }"
      >
        <MoodDot :color="mood.color" />
        {{ mood.label }} {{ entry.score }}/10
      </span>
      <p
        v-if="entry.note"
        class="journal-check-in__note"
      >
        {{ entry.note }}
      </p>
      <div
        v-if="entry.tags.length"
        class="journal-check-in__tags"
      >
        <button
          v-for="tag in entry.tags"
          :key="tag"
          type="button"
          class="journal-check-in__tag"
          @click="emit('tag', tag)"
        >
          #{{ tag }}
        </button>
      </div>
    </div>
  </div>
</template>
