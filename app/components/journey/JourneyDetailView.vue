<script setup lang="ts">
import type { MoodEntry } from '~/types/mood'
import {
  type AttemptView, climb, evidence, headerMeta, journeyChart, journeyNotes, nextFloor, phases, whyLabel,
} from '~/utils/analytics/journeyDetail'

const props = defineProps<{
  view: AttemptView
  /** Check-ins during the attempt, oldest first. */
  during: readonly MoodEntry[]
  /** Check-ins in the 30 days before it began. */
  before: readonly MoodEntry[]
  timeZone: string
}>()

const journey = computed(() => props.view.journey)
const floors = computed(() => climb(props.view, props.timeZone))
const next = computed(() => nextFloor(props.view))
const rows = computed(() => evidence(props.view, props.during, props.before, props.timeZone))
const chart = computed(() => journeyChart(props.view, props.during, props.before))
const stretches = computed(() => phases(props.view, props.during, props.before))
const notes = computed(() => journeyNotes(props.view, props.during))
</script>

<template>
  <div class="journey-detail">
    <header class="journey-detail__header">
      <Breadcrumb
        class="journey-detail__crumbs"
        :trail="[{ label: 'Journeys', to: '/journeys' }]"
        :current="journey.name"
      />
      <span class="journey-detail__day">Day {{ view.day }}</span>
      <h1 class="journey-detail__title">
        {{ journey.name }}
      </h1>
      <span class="journey-detail__meta">{{ headerMeta(view, timeZone) }}</span>
    </header>

    <div class="journey-detail__body">
      <div class="journey-detail__floors">
        <JourneyClimb :climb="floors" />
      </div>

      <div class="journey-detail__content">
        <JourneyNextFloor
          v-if="next"
          :next="next"
          :evidence="rows"
        />
        <JourneyMoodChart
          :chart="chart"
          :phases="stretches"
        />
        <JourneyNotes :notes="notes" />
        <JourneySection
          :label="whyLabel(journey, timeZone)"
          title="Why you're doing this"
          muted
          spacing="why"
        >
          <p class="journey-detail__why">
            “{{ journey.why }}”
          </p>
        </JourneySection>
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
