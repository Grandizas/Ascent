<script setup lang="ts">
import type { StatCell } from '~/utils/analytics/timeline'

defineProps<{ cells: readonly StatCell[] }>()
</script>

<template>
  <section
    class="timeline-stats"
    aria-label="Summary"
  >
    <div
      v-for="cell in cells"
      :key="cell.key"
      class="timeline-stats__cell"
    >
      <span class="timeline-stats__key">{{ cell.key }}</span>
      <span class="timeline-stats__main">
        <span
          class="timeline-stats__value"
          :class="{ 'is-long': cell.value.length > 9 }"
        >{{ cell.value }}</span>
        <span
          class="timeline-stats__sub"
          :class="cell.tone && `is-${cell.tone}`"
        >{{ cell.sub }}</span>
      </span>
    </div>
  </section>
</template>
