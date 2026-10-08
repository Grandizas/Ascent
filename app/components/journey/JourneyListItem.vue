<script setup lang="ts">
import { changeTone, type ClimbingRow, formatChange } from '~/utils/journey'

defineProps<{ row: ClimbingRow }>()
</script>

<template>
  <NuxtLink
    :to="`/journeys/${row.journey.id}`"
    class="journey-row"
  >
    <span class="journey-row__head">
      <span class="journey-row__title">
        <span class="journey-row__name">{{ row.journey.name }}</span>
        <span class="journey-row__meta">{{ row.meta }}</span>
      </span>
      <span class="journey-row__figures">
        <span class="journey-row__mood">
          <span class="journey-row__mood-label">Mood vs before</span>
          <span
            class="journey-row__mood-value"
            :class="`is-${changeTone(row.change)}`"
          >{{ formatChange(row.change) }}</span>
        </span>
        <span class="journey-row__day">
          <span class="journey-row__day-label">Day</span>
          <span class="journey-row__day-value">{{ row.day }}</span>
        </span>
      </span>
    </span>
    <CheckpointTrack :track="row.track" />
    <span class="journey-row__foot">
      <span class="journey-row__next">{{ row.next }}</span>
      <span class="journey-row__why">“{{ row.journey.why }}”</span>
    </span>
  </NuxtLink>
</template>
