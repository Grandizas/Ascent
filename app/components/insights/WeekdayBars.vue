<script setup lang="ts">
import { WEEKDAYS } from '~/utils/analytics/insights'
import { moodColorContinuous } from '~/utils/mood'

const props = defineProps<{
  /** Monday first; null where there are no check-ins. */
  averages: readonly (number | null)[]
}>()

const bars = computed(() => {
  const known = props.averages.filter((v): v is number => v !== null)
  const max = Math.max(...known)
  const min = Math.min(...known)
  return props.averages.map((value, i) => ({
    day: WEEKDAYS[i]!,
    value,
    // 12–64px between the hardest and the best day; those two are drawn solid.
    height: value === null ? 0 : 12 + ((value - min) / Math.max(0.01, max - min)) * 52,
    color: moodColorContinuous(value ?? 5),
    extreme: value !== null && (value === max || value === min),
  }))
})
</script>

<template>
  <div
    class="weekday-bars"
    role="list"
    aria-label="Average mood by weekday"
  >
    <div
      v-for="bar in bars"
      :key="bar.day"
      class="weekday-bars__day"
      role="listitem"
    >
      <span class="weekday-bars__track">
        <span
          class="weekday-bars__bar"
          :class="{ 'is-extreme': bar.extreme }"
          :style="{ height: `${bar.height}px`, background: bar.color }"
        />
      </span>
      <span class="weekday-bars__text">
        <span class="weekday-bars__value">{{ bar.value === null ? '—' : bar.value.toFixed(1) }}</span>
        <span class="weekday-bars__name">{{ bar.day }}</span>
      </span>
    </div>
  </div>
</template>
