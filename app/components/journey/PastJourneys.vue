<script setup lang="ts">
import { changeTone, formatChange, type PastRow } from '~/utils/journey'

defineProps<{ rows: readonly PastRow[] }>()
</script>

<template>
  <section
    class="past-journeys"
    aria-labelledby="past-journeys-label"
  >
    <SectionLabel
      id="past-journeys-label"
      class="past-journeys__label"
    >
      Behind you
    </SectionLabel>
    <NuxtLink
      v-for="row in rows"
      :key="row.id"
      :to="`/journeys/${row.journeyId}`"
      class="past-journeys__row"
    >
      <span class="past-journeys__title">
        <span class="past-journeys__name">{{ row.name }}</span>
        <span class="past-journeys__dates">{{ row.dates }}</span>
      </span>
      <span
        class="past-journeys__status"
        :class="{ 'is-completed': row.completed }"
      >{{ row.status }}</span>
      <span
        class="past-journeys__change"
        :class="`is-${changeTone(row.change)}`"
        :aria-label="`Mood change ${formatChange(row.change)}`"
      >{{ formatChange(row.change) }}</span>
    </NuxtLink>
    <p class="past-journeys__note">
      Right column: change in average mood during the journey, against the 30 days before it.
    </p>
  </section>
</template>
