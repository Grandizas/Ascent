<script setup lang="ts">
import type { JourneyLane } from '~/utils/analytics/timelineChart'

defineProps<{ lanes: readonly JourneyLane[] }>()
</script>

<template>
  <div class="journey-lanes">
    <div class="journey-lanes__head">
      <SectionLabel>Journeys in this period</SectionLabel>
      <span
        v-if="lanes.length"
        class="journey-lanes__count"
      >{{ lanes.length }} overlapping</span>
    </div>
    <div
      v-for="lane in lanes"
      :key="lane.journey.id"
      class="journey-lanes__row"
    >
      <span
        class="journey-lanes__name"
        :class="{ 'is-active': lane.journey.status === 'active' }"
      >{{ lane.journey.name }}</span>
      <span class="journey-lanes__track">
        <span
          class="journey-lanes__bar"
          :class="`is-${lane.journey.status}`"
          :style="{ left: `calc(26px + ${lane.left * 100}%)`, width: `${lane.width * 100}%` }"
        />
      </span>
      <span class="journey-lanes__status">{{ lane.journey.statusLabel }}</span>
    </div>
    <p
      v-if="!lanes.length"
      class="journey-lanes__empty"
    >
      No journeys ran during this period.
    </p>
  </div>
</template>
