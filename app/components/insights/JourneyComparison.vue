<script setup lang="ts">
import { COMPARISON_SCALE, comparisonX, formatSigned, type JourneyComparisonRow } from '~/utils/analytics/insights'

defineProps<{ rows: readonly JourneyComparisonRow[] }>()

const percent = (share: number) => `${share * 100}%`
const segment = (row: JourneyComparisonRow) => {
  const a = comparisonX(row.before)
  const b = comparisonX(row.during)
  return { left: percent(Math.min(a, b)), width: percent(Math.abs(b - a)) }
}
</script>

<template>
  <div class="journey-compare">
    <div
      class="journey-compare__head"
      aria-hidden="true"
    >
      <span />
      <span class="journey-compare__scale">
        <span
          v-for="label in COMPARISON_SCALE.labels"
          :key="label"
          class="journey-compare__tick"
          :style="{ left: percent(comparisonX(label)) }"
        >{{ label }}</span>
      </span>
      <span class="journey-compare__change">Change</span>
    </div>
    <div
      v-for="row in rows"
      :key="row.id"
      class="journey-compare__row"
      :class="row.change >= 0 ? 'is-up' : 'is-down'"
    >
      <span class="journey-compare__title">
        <span class="journey-compare__name">{{ row.name }}</span>
        <span class="journey-compare__status">{{ row.status }}</span>
      </span>
      <span
        class="journey-compare__track"
        role="img"
        :aria-label="`${row.before.toFixed(1)} in the 30 days before, ${row.during.toFixed(1)} during`"
      >
        <span class="journey-compare__axis" />
        <span
          class="journey-compare__segment"
          :style="segment(row)"
        />
        <span
          class="journey-compare__before"
          :style="{ left: percent(comparisonX(row.before)) }"
        />
        <span
          class="journey-compare__during"
          :style="{ left: percent(comparisonX(row.during)) }"
        />
      </span>
      <span class="journey-compare__change">{{ formatSigned(row.change) }}</span>
    </div>
    <p
      v-if="!rows.length"
      class="journey-compare__empty"
    >
      No journey has enough check-ins before and during it yet.
    </p>
    <div class="journey-compare__legend">
      <span class="journey-compare__key"><span class="journey-compare__before is-key" />30 days before</span>
      <span class="journey-compare__key"><span class="journey-compare__during is-key" />During</span>
    </div>
  </div>
</template>
