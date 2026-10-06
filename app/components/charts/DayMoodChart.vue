<script setup lang="ts">
import type { ChartLane } from '~/types/chart'
import type { MoodEntry } from '~/types/mood'
import { dayAxisPosition, scoreToY, smoothPath, type Point } from '~/utils/chart'
import { formatClock, minuteOfDay } from '~/utils/date'
import { getMood, MOODS } from '~/utils/mood'

const props = defineProps<{
  /** The day's entries. */
  entries: readonly MoodEntry[]
  /** Another day drawn as a dashed line (yesterday). */
  comparison?: readonly MoodEntry[]
  showComparison?: boolean
  timeZone: string
  /** Current minute of the day, or null when the chart shows a past day. */
  nowMinute: number | null
  /** Entry that was just logged; its point gets a ring animation. */
  freshId?: string | null
  pulseKey?: number
  lane?: ChartLane
}>()

// The SVG is drawn in a 1000×220 box and stretched to fit.
const W = 1000
const H = 220
const Y_TICKS = [10, 7, 4, 1]
const X_TICKS = [6, 9, 12, 15, 18, 21, 24].map(hour => ({
  hour,
  label: `${String(hour).padStart(2, '0')}:00`,
  left: ((hour - 6) / 18) * 100,
  minor: hour % 6 !== 0,
}))

const uid = useId()
const lineGradient = `${uid}-line`
const areaGradient = `${uid}-area`

const pct = (n: number) => `${n}%`
const toPoint = (entry: MoodEntry): Point =>
  [dayAxisPosition(minuteOfDay(entry.loggedAt, props.timeZone)) * W, scoreToY(entry.score, H)]

const sorted = computed(() => [...props.entries].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt)))

const points = computed(() => sorted.value.map((entry) => {
  const [x, y] = toPoint(entry)
  return { entry, x, y, mood: getMood(entry.level), minute: minuteOfDay(entry.loggedAt, props.timeZone) }
}))

const linePath = computed(() => smoothPath(points.value.map(p => [p.x, p.y] as const)))
const areaPath = computed(() => {
  const pts = points.value
  if (!linePath.value) return ''
  return `${linePath.value} L${pts.at(-1)!.x.toFixed(1)},${H} L${pts[0]!.x.toFixed(1)},${H} Z`
})
const comparisonPath = computed(() =>
  props.showComparison && props.comparison ? smoothPath([...props.comparison].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt)).map(toPoint)) : '')

const nowX = computed(() => (props.nowMinute == null ? null : dayAxisPosition(props.nowMinute) * W))

const hoverId = ref<string | null>(null)
const hovered = computed(() => points.value.find(p => p.entry.id === hoverId.value) ?? null)
const tooltip = computed(() => {
  const p = hovered.value
  if (!p) return null
  const xPct = p.x / 10
  return {
    x: pct(xPct),
    y: pct((p.y / H) * 100),
    transform: `translate(${xPct > 62 ? 'calc(-100% - 14px)' : '14px'}, ${p.entry.score > 6 ? '-10%' : '-90%'})`,
    color: p.mood.color,
    title: p.mood.label,
    value: `${p.entry.score}/10`,
    meta: formatClock(p.minute),
    body: p.entry.note || 'No note',
    sub: p.entry.tags.join(' · ') || 'No tags',
  }
})

const laneMarks = computed(() => {
  const lane = props.lane
  if (!lane) return []
  return points.value
    .filter(p => p.entry.tags.includes(lane.tag))
    .map(p => ({ id: p.entry.id, left: pct(p.x / 10), title: `${lane.itemLabel} ${formatClock(p.minute)}` }))
})

const summary = computed(() => {
  const n = points.value.length
  return n ? `Mood through the day: ${n} check-in${n === 1 ? '' : 's'}.` : 'No check-ins yet today.'
})
</script>

<template>
  <div class="day-chart">
    <div
      class="day-chart__y"
      aria-hidden="true"
    >
      <span
        v-for="tick in Y_TICKS"
        :key="tick"
        :style="{ top: pct((scoreToY(tick, H) / H) * 100) }"
      >{{ tick }}</span>
    </div>

    <div
      class="day-chart__plot"
      @mouseleave="hoverId = null"
    >
      <svg
        class="day-chart__svg"
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="none"
        role="img"
        :aria-label="summary"
      >
        <defs>
          <linearGradient
            :id="lineGradient"
            x1="0"
            :y1="H"
            x2="0"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              v-for="(mood, i) in MOODS"
              :key="mood.level"
              :offset="0.1 + i * 0.2"
              :style="{ stopColor: mood.color }"
            />
          </linearGradient>
          <linearGradient
            :id="areaGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0"
              class="day-chart__area-stop day-chart__area-stop--top"
            />
            <stop
              offset="1"
              class="day-chart__area-stop"
            />
          </linearGradient>
        </defs>

        <line
          v-for="tick in Y_TICKS"
          :key="tick"
          class="day-chart__grid"
          x1="0"
          :x2="W"
          :y1="scoreToY(tick, H)"
          :y2="scoreToY(tick, H)"
        />
        <rect
          v-if="nowX != null"
          class="day-chart__future"
          :x="nowX"
          y="0"
          :width="Math.max(0, W - nowX)"
          :height="H"
        />
        <path
          v-if="comparisonPath"
          class="day-chart__comparison"
          :d="comparisonPath"
        />
        <path
          v-if="areaPath"
          :d="areaPath"
          :fill="`url(#${areaGradient})`"
        />
        <path
          v-if="linePath"
          class="day-chart__line"
          :d="linePath"
          :stroke="`url(#${lineGradient})`"
        />
      </svg>

      <div
        v-if="nowX != null && nowMinute != null"
        class="day-chart__now"
        :style="{ left: pct(nowX / 10) }"
      >
        <span class="day-chart__now-label">Now {{ formatClock(nowMinute) }}</span>
      </div>

      <button
        v-for="p in points"
        :key="p.entry.id"
        type="button"
        class="day-chart__point"
        :class="{ 'is-hovered': p.entry.id === hoverId }"
        :style="{ 'left': pct(p.x / 10), 'top': pct((p.y / H) * 100), '--mood': p.mood.color }"
        :aria-label="`${p.mood.label} ${p.entry.score}/10 at ${formatClock(p.minute)}`"
        @mouseenter="hoverId = p.entry.id"
        @focus="hoverId = p.entry.id"
        @blur="hoverId = null"
      >
        <span
          v-if="p.entry.id === freshId"
          :key="pulseKey"
          class="day-chart__ring"
        />
        <span class="day-chart__dot" />
      </button>

      <ChartTooltip
        v-if="tooltip"
        v-bind="tooltip"
      />
    </div>

    <div
      class="day-chart__x"
      aria-hidden="true"
    >
      <span
        v-for="tick in X_TICKS"
        :key="tick.hour"
        class="day-chart__x-label"
        :class="{ 'is-minor': tick.minor, 'is-first': tick.hour === 6, 'is-last': tick.hour === 24 }"
        :style="{ left: tick.hour === 24 ? undefined : pct(tick.left) }"
      >{{ tick.label }}</span>
    </div>

    <div
      v-if="lane"
      class="day-chart__lane"
    >
      <span class="day-chart__lane-label">{{ lane.label }}</span>
      <span
        v-for="mark in laneMarks"
        :key="mark.id"
        class="day-chart__lane-mark"
        :style="{ left: mark.left }"
        :title="mark.title"
      >
        <Diamond
          variant="filled"
          color="oklch(0.64 0.06 232 / 0.85)"
        />
      </span>
    </div>
  </div>
</template>
