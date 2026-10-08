<script setup lang="ts">
import type { JourneyNote } from '~/utils/analytics/journeyDetail'

defineProps<{ notes: readonly JourneyNote[] }>()
</script>

<template>
  <JourneySection
    label="In your own words"
    title="Notes along the way"
    spacing="notes"
  >
    <div
      v-for="note in notes"
      :key="note.id"
      class="journey-notes__note"
    >
      <span class="journey-notes__day">Day {{ note.day }}</span>
      <span class="journey-notes__text">“{{ note.text }}”</span>
      <span class="journey-notes__score">{{ note.score }}/10</span>
    </div>
    <p
      v-if="!notes.length"
      class="journey-notes__empty"
    >
      No notes yet. Notes you add to check-ins during this journey appear here.
    </p>
  </JourneySection>
</template>
