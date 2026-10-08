<script setup lang="ts">
import { type JourneyChartModel, moodSummary, type Phase } from '~/utils/analytics/journeyDetail'
import { smoothPath } from '~/utils/chart'

const props = defineProps<{
  chart: JourneyChartModel
  phases: readonly Phase[]
}>()

// SVG space: 1000 × 170, stretched to the box (strokes don't scale).
const W = 1000
const H = 170
const path = computed(() => smoothPath(props.chart.points.map(p => [p.x * W, p.y * H])))
const baselineY = computed(() => (props.chart.baseline === null ? null : (1 - props.chart.baseline / 10) * H))
const percent = (share: number) => `${share * 100}%`
const summary = computed(() => moodSummary(props.chart))
const describe = computed(() => props.chart.points.map(p => `Day ${p.day} ${p.value.toFixed(1)}`).join(', ') || 'No check-ins since Day 1 yet')
</script>

<template>
  <JourneySection
    label="Mood · Daily average"
    title="How your mood has moved"
  >
    <div class="journey-chart">
      <div
        class="journey-chart__plot"
        role="img"
        :aria-label="`Daily average mood: ${describe}.`"
      >
        <svg
          class="journey-chart__svg"
          :viewBox="`0 0 ${W} ${H}`"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            v-for="y in [0, H / 2]"
            :key="y"
            class="journey-chart__grid"
            x1="0"
            :x2="W"
            :y1="y"
            :y2="y"
          />
          <line
            class="journey-chart__axis"
            x1="0"
            :x2="W"
            :y1="H"
            :y2="H"
          />
          <line
            class="journey-chart__axis"
            x1="0"
            x2="0"
            y1="0"
            :y2="H"
          />
          <line
            v-for="x in chart.guides"
            :key="x"
            class="journey-chart__guide"
            :x1="x * W"
            :x2="x * W"
            y1="0"
            :y2="H"
          />
          <line
            v-if="baselineY !== null"
            class="journey-chart__baseline"
            x1="0"
            :x2="W"
            :y1="baselineY"
            :y2="baselineY"
          />
          <path
            class="journey-chart__line"
            :d="path"
          />
        </svg>
        <span
          v-for="(label, i) in ['10', '5', '0']"
          :key="label"
          class="journey-chart__y"
          :style="{ top: percent(i / 2) }"
          aria-hidden="true"
        >{{ label }}</span>
        <span
          v-if="chart.baseline !== null"
          class="journey-chart__before"
          :style="{ top: percent(1 - chart.baseline / 10) }"
        >Before · {{ chart.baseline.toFixed(1) }}</span>
        <span
          v-for="point in chart.points"
          :key="point.day"
          class="journey-chart__dot"
          :class="{ 'is-latest': point.latest, 'is-below': point.belowBaseline }"
          :style="{ left: percent(point.x), top: percent(point.y) }"
          :title="`Day ${point.day} · ${point.value.toFixed(1)}`"
          aria-hidden="true"
        />
      </div>
      <div
        class="journey-chart__marks"
        aria-hidden="true"
      >
        <span
          v-for="mark in chart.marks"
          :key="mark.label"
          class="journey-chart__mark"
          :class="{ 'is-current': mark.current }"
          :style="{ left: percent(mark.x) }"
        >{{ mark.label }}</span>
      </div>
    </div>
    <div class="journey-phases">
      <div
        v-for="phase in phases"
        :key="phase.label"
        class="journey-phases__phase"
        :class="`is-${phase.tone}`"
      >
        <span class="journey-phases__value">{{ phase.value === null ? '—' : phase.value.toFixed(1) }}</span>
        <span class="journey-phases__label">{{ phase.label }}</span>
      </div>
    </div>
    <p
      v-if="summary"
      class="journey-chart__summary"
    >
      {{ summary }}
    </p>
  </JourneySection>
</template>
