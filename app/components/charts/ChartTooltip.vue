<script setup lang="ts">
defineProps<{
  /** Left/top of the anchor point, as CSS values (e.g. "42%"). */
  x: string
  y: string
  /** CSS transform that places the card beside the anchor. */
  transform: string
  color: string
  title: string
  /** Mono text next to the title, e.g. "7/10". */
  value?: string
  /** Mono text on the right, e.g. a time. */
  meta?: string
  body: string
  sub?: string
}>()
</script>

<template>
  <div
    class="chart-tooltip"
    role="tooltip"
    :style="{ left: x, top: y, transform }"
  >
    <div class="chart-tooltip__head">
      <span class="chart-tooltip__title">
        <MoodDot :color="color" />
        <span>{{ title }}</span>
        <span
          v-if="value"
          class="chart-tooltip__value"
        >{{ value }}</span>
      </span>
      <span
        v-if="meta"
        class="chart-tooltip__meta"
      >{{ meta }}</span>
    </div>
    <span class="chart-tooltip__body">{{ body }}</span>
    <span
      v-if="sub"
      class="chart-tooltip__sub"
    >{{ sub }}</span>
  </div>
</template>
