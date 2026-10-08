<script setup lang="ts">
import type { EvidenceRow, NextFloor } from '~/utils/analytics/journeyDetail'

defineProps<{
  next: NextFloor
  evidence: readonly EvidenceRow[]
}>()
</script>

<template>
  <JourneySection
    :label="`Next floor · Day ${next.day} · ${next.countdown}`"
    title="What often shifts around here"
  >
    <p class="journey-next__expectation">
      {{ next.expectation }}
    </p>
    <div class="journey-next__table">
      <div class="journey-next__columns">
        <span class="journey-next__column">Often reported</span>
        <span class="journey-next__column is-yours">Your entries</span>
      </div>
      <div
        v-for="row in evidence"
        :key="row.topic"
        class="journey-next__row"
      >
        <span class="journey-next__topic">{{ row.topic }}</span>
        <div class="journey-next__cells">
          <span class="journey-next__common">{{ row.common }}</span>
          <span class="journey-next__yours">{{ row.yours }}</span>
        </div>
      </div>
    </div>
    <p class="journey-detail__footnote">
      General patterns, not promises. Where your entries disagree, trust your entries.
    </p>
  </JourneySection>
</template>
