<script setup lang="ts">
import type { ChartLane } from '~/types/chart'
import type { MoodEntry } from '~/types/mood'
import { formatAverage, formatRange, summarizeScores } from '~/utils/analytics/stats'

const props = defineProps<{
  entries: readonly MoodEntry[]
  yesterday: readonly MoodEntry[]
  /** Average score over the last 30 days. */
  monthAverage: number | null
  timeZone: string
  nowMinute: number
  freshId?: string | null
  pulseKey?: number
  lane?: ChartLane
  observation?: { text: string, caption?: string }
}>()

const showYesterday = ref(true)
const summary = computed(() => summarizeScores(props.entries.map(e => e.score)))
const stats = computed(() => [
  { label: 'average', value: formatAverage(summary.value.average), main: true },
  { label: 'range', value: formatRange(summary.value) },
  { label: 'check-ins', value: String(summary.value.count) },
  { label: '30-day avg', value: formatAverage(props.monthAverage) },
])
</script>

<template>
  <section
    class="today-mood"
    aria-labelledby="today-mood-label"
  >
    <div class="today-mood__head">
      <div class="today-mood__summary">
        <SectionLabel
          id="today-mood-label"
          size="md"
        >
          Today's mood
        </SectionLabel>
        <div class="today-mood__stats">
          <span
            v-for="stat in stats"
            :key="stat.label"
            class="today-mood__stat"
            :class="{ 'today-mood__stat--main': stat.main }"
          >
            <span class="today-mood__stat-value">{{ stat.value }}</span>
            <span class="today-mood__stat-label">{{ stat.label }}</span>
          </span>
        </div>
      </div>
      <div class="today-mood__controls">
        <button
          type="button"
          class="today-mood__compare"
          :class="{ 'is-on': showYesterday }"
          :aria-pressed="showYesterday"
          @click="showYesterday = !showYesterday"
        >
          <span
            class="today-mood__compare-line"
            aria-hidden="true"
          />Yesterday
        </button>
        <NuxtLink
          to="/timeline"
          class="text-link"
        >
          Open timeline
          <AppIcon name="arrow-right" />
        </NuxtLink>
      </div>
    </div>

    <DayMoodChart
      :entries="entries"
      :comparison="yesterday"
      :show-comparison="showYesterday"
      :time-zone="timeZone"
      :now-minute="nowMinute"
      :fresh-id="freshId"
      :pulse-key="pulseKey"
      :lane="lane"
    />

    <ObservationItem
      v-if="observation"
      class="today-mood__observation"
      :text="observation.text"
      :caption="observation.caption"
    />
  </section>
</template>
