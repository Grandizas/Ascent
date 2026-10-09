<script setup lang="ts">
import { arcY, type ReviewLane, type ReviewMonth, type ReviewWeek } from '~/utils/analytics/review'
import { smoothPath } from '~/utils/chart'
import { formatMonthDay } from '~/utils/date'
import { moodColorContinuous } from '~/utils/mood'

const props = defineProps<{
  weeks: readonly ReviewWeek[]
  months: readonly ReviewMonth[]
  average: number | null
  best: number | null
  hardest: number | null
  lanes: readonly ReviewLane[]
}>()

// SVG space: 1000 × 240, stretched to the box.
const W = 1000
const H = 240
const uid = useId()
const percent = (share: number) => `${share * 100}%`

const points = computed(() => props.weeks.map(w => [w.x * W, arcY(w.average) * H] as const))
const line = computed(() => smoothPath(points.value))
const area = computed(() => {
  const pts = points.value
  return pts.length > 1 ? `${line.value} L${pts.at(-1)![0]},${H} L${pts[0]![0]},${H} Z` : ''
})
// The line's colour follows its height: blue low, warm high (the design's own stops).
const lineStops = [[0, 262], [0.35, 232], [0.55, 85], [0.75, 78], [1, 68]].map(([offset, hue]) => ({
  offset: offset!,
  color: `oklch(${(0.58 + offset! * 0.25).toFixed(3)} ${offset! > 0.45 && offset! < 0.65 ? 0.02 : 0.08} ${hue})`,
}))

const callouts = computed(() => [
  props.best !== null && { month: props.best, word: 'Best month', tone: 'best', top: true },
  props.hardest !== null && props.hardest !== props.best && { month: props.hardest, word: 'Hardest month', tone: 'hardest', top: false },
].filter(c => c !== false).map(({ month, word, tone, top }) => {
  // Centred over its month; pinned to the edge in January and December.
  const x = month === 11 ? 1 : month === 0 ? 0 : (month + 0.5) / 12
  const side = x > 0.85 ? 'end' : x < 0.15 ? 'start' : 'middle'
  return { key: word, word, tone, top, side, x, value: props.months[month]!.average!.toFixed(1) }
}))

const hovered = ref<ReviewWeek | null>(null)
const tooltip = computed(() => {
  const w = hovered.value
  if (!w) return null
  return {
    x: percent(w.x),
    y: percent(arcY(w.average)),
    color: moodColorContinuous(w.average),
    flip: w.x > 0.7,
    title: `Week of ${formatMonthDay(w.start)}`,
    value: w.average.toFixed(1),
    body: w.note ? `“${w.note}”` : `${w.entries} check-ins`,
  }
})

const description = computed(() => props.months
  .filter(m => m.average !== null)
  .map(m => `${m.short} ${m.average!.toFixed(1)}`)
  .join(', '))
</script>

<template>
  <div class="year-arc">
    <div
      class="year-arc__plot"
      role="img"
      :aria-label="`Weekly average mood through the year. Monthly averages: ${description || 'no check-ins yet'}.`"
      @mouseleave="hovered = null"
    >
      <svg
        class="year-arc__svg"
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            :id="`${uid}-line`"
            x1="0"
            :y1="H"
            x2="0"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              v-for="stop in lineStops"
              :key="stop.offset"
              :offset="stop.offset"
              :style="{ stopColor: stop.color }"
            />
          </linearGradient>
          <linearGradient
            :id="`${uid}-area`"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0"
              class="year-arc__area-stop year-arc__area-stop--top"
            />
            <stop
              offset="1"
              class="year-arc__area-stop"
            />
          </linearGradient>
        </defs>
        <line
          v-for="v in [7, 5.5, 4]"
          :key="v"
          class="year-arc__grid"
          x1="0"
          :x2="W"
          :y1="arcY(v) * H"
          :y2="arcY(v) * H"
        />
        <line
          v-for="k in 11"
          :key="`m${k}`"
          class="year-arc__month-line"
          :x1="(k / 12) * W"
          :x2="(k / 12) * W"
          y1="0"
          :y2="H"
        />
        <rect
          v-if="best !== null"
          class="year-arc__best"
          :x="(best / 12) * W"
          y="0"
          :width="W / 12"
          :height="H"
        />
        <rect
          v-if="hardest !== null"
          class="year-arc__hardest"
          :x="(hardest / 12) * W"
          y="0"
          :width="W / 12"
          :height="H"
        />
        <path
          v-if="area"
          :d="area"
          :fill="`url(#${uid}-area)`"
        />
        <line
          v-if="average !== null"
          class="year-arc__average"
          x1="0"
          :x2="W"
          :y1="arcY(average) * H"
          :y2="arcY(average) * H"
        />
        <path
          v-if="line"
          class="year-arc__line"
          :d="line"
          :stroke="`url(#${uid}-line)`"
        />
      </svg>

      <span
        v-for="v in [7, 5.5, 4]"
        :key="v"
        class="year-arc__y"
        :style="{ top: percent(arcY(v)) }"
        aria-hidden="true"
      >{{ v }}</span>

      <span
        v-for="week in weeks"
        :key="week.start"
        class="year-arc__zone"
        :style="{ left: percent(week.x), width: percent(1 / weeks.length) }"
        aria-hidden="true"
        @mouseenter="hovered = week"
      />

      <span
        v-for="callout in callouts"
        :key="callout.key"
        class="year-arc__callout"
        :class="[`is-${callout.tone}`, `is-${callout.side}`, callout.top ? 'is-top' : 'is-bottom']"
        :style="{ left: percent(callout.x) }"
        aria-hidden="true"
      >
        <span class="year-arc__callout-word">{{ callout.word }}</span>
        <span class="year-arc__callout-value">{{ callout.value }}</span>
      </span>

      <div
        v-if="tooltip"
        class="year-arc__hover"
        :style="{ left: tooltip.x }"
        aria-hidden="true"
      >
        <span
          class="year-arc__hover-dot"
          :style="{ top: tooltip.y, background: tooltip.color }"
        />
        <div
          class="year-arc__tooltip"
          :class="{ 'is-flipped': tooltip.flip }"
        >
          <div class="year-arc__tooltip-head">
            <span>{{ tooltip.title }}</span>
            <span class="year-arc__tooltip-value">{{ tooltip.value }}</span>
          </div>
          <span class="year-arc__tooltip-body">{{ tooltip.body }}</span>
        </div>
      </div>
    </div>

    <div
      class="year-arc__months"
      aria-hidden="true"
    >
      <span
        v-for="m in months"
        :key="m.month"
        class="year-arc__month"
        :class="{ 'is-best': m.month === best, 'is-hardest': m.month === hardest }"
      >{{ m.short }}</span>
    </div>

    <div class="year-arc__lanes">
      <div
        v-for="lane in lanes"
        :key="lane.id"
        class="year-arc__lane"
      >
        <span
          class="year-arc__lane-bar"
          :class="`is-${lane.tone}`"
          :style="{ left: percent(lane.left), width: percent(lane.width) }"
        />
        <span
          class="year-arc__lane-name"
          :class="{ 'is-before': lane.left + lane.width > 0.72 }"
          :style="{ left: percent(lane.left + lane.width > 0.72 ? lane.left : lane.left + lane.width) }"
        >{{ lane.name }}</span>
      </div>
    </div>
  </div>
</template>
