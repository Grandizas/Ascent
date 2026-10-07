<script setup lang="ts">
import type { JourneySpan } from '~/types/journey'
import type { MoodEntry } from '~/types/mood'
import {
  canGoNewer, canGoOlder, moments, patterns, type Period, periodShortLabel, periodTitle, type TimelineRange, timelineStats,
} from '~/utils/analytics/timeline'
import { journeyLanes, journeyMarkers, lineChartModel, yearHeatmapModel } from '~/utils/analytics/timelineChart'
import { type DayKey, formatMonthYear } from '~/utils/date'

const props = defineProps<{
  period: Period
  today: DayKey
  timeZone: string
  /** Entries in the period. */
  entries: readonly MoodEntry[]
  /** Entries in the period before (for "vs previous"); null for all time. */
  previous: readonly MoodEntry[] | null
  /** All check-ins ever, and the first day with data. */
  total: number
  firstDay: DayKey
  journeys: readonly JourneySpan[]
}>()

const emit = defineEmits<{ navigate: [range: TimelineRange, offset: number] }>()

const olderAvailable = computed(() => canGoOlder(props.period, props.today, props.firstDay))
const newerAvailable = computed(() => canGoNewer(props.period))
const older = () => olderAvailable.value && emit('navigate', props.period.range, props.period.offset + 1)
const newer = () => newerAvailable.value && emit('navigate', props.period.range, props.period.offset - 1)

const title = computed(() => periodTitle(props.period, props.today))
const shortLabel = computed(() => periodShortLabel(props.period, props.today))
const eyebrow = computed(() => (props.total
  ? `Timeline · ${props.total.toLocaleString('en-GB')} check-ins since ${formatMonthYear(props.firstDay)}`
  : 'Timeline · no check-ins yet'))

const stats = computed(() => timelineStats(props.entries, props.previous, props.period, props.today, props.timeZone))
const isYear = computed(() => props.period.range === 'year')
const year = computed(() => Number(props.period.start.slice(0, 4)))
const chart = computed(() => (isYear.value ? null : lineChartModel(props.entries, props.period, props.timeZone)))
const heatmap = computed(() => (isYear.value ? yearHeatmapModel(props.entries, year.value, props.today, props.timeZone) : null))
const markers = computed(() => journeyMarkers(props.journeys, props.period))
const lanes = computed(() => journeyLanes(props.journeys, props.period, props.today))
const best = computed(() => moments(props.entries, 'best'))
const lowest = computed(() => moments(props.entries, 'lowest'))
const found = computed(() => patterns(props.entries, props.period, props.timeZone))

defineExpose({ older, newer })
</script>

<template>
  <div class="page page--timeline timeline">
    <PageHeader
      :eyebrow="eyebrow"
      :title="title"
    >
      <template #actions>
        <PeriodNav
          :range="period.range"
          :can-go-older="olderAvailable"
          :can-go-newer="newerAvailable"
          @update:range="emit('navigate', $event, 0)"
          @older="older"
          @newer="newer"
        />
      </template>
    </PageHeader>

    <TimelineStats :cells="stats" />

    <section
      class="timeline__chart"
      aria-label="Mood over the period"
    >
      <YearHeatmap
        v-if="heatmap"
        :model="heatmap"
        :year="year"
      />
      <MoodLineChart
        v-else-if="chart"
        class="timeline-chart"
        :height="280"
        :line="chart.line"
        :band="chart.band"
        :average="chart.average"
        :points="chart.points"
        :ticks="chart.ticks"
        :dividers="chart.dividers"
        :description="`Mood for ${title}`"
        empty-label="No check-ins in this period."
      >
        <template #overlay>
          <div
            v-for="(marker, i) in markers"
            :key="marker.id"
            class="timeline-chart__marker"
            :style="{ left: `${marker.x * 100}%` }"
          >
            <span
              class="timeline-chart__marker-label"
              :class="{ 'is-flipped': marker.x > 0.7 }"
              :style="{ top: `${i * 18 - 2}px` }"
            >{{ marker.label }}</span>
          </div>
        </template>
      </MoodLineChart>

      <JourneyLanes :lanes="lanes" />
    </section>

    <div class="timeline__moments">
      <MomentsColumn
        title="Best moments"
        :period-label="shortLabel"
        :entries="best"
        :time-zone="timeZone"
        :with-date="period.range !== 'day'"
      />
      <MomentsColumn
        title="Lowest moments"
        :period-label="shortLabel"
        :entries="lowest"
        :time-zone="timeZone"
        :with-date="period.range !== 'day'"
      />
    </div>

    <PatternList :items="found" />
  </div>
</template>
