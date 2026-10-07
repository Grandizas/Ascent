<script setup lang="ts">
import type { JourneyEvent } from '~/utils/analytics/journal'

defineProps<{ event: JourneyEvent }>()
</script>

<template>
  <div
    class="journal-event"
    :class="`journal-event--${event.tone}`"
  >
    <Diamond
      variant="filled"
      :size="8"
    />
    <span class="journal-event__text">{{ event.text }}</span>
    <span
      v-if="event.sub"
      class="journal-event__sub"
    >{{ event.sub }}</span>
  </div>
</template>
