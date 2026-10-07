<script setup lang="ts">
import type { TooltipContent } from '~/utils/analytics/timelineChart'
import { type AxisTick, placeTooltip, scoreToY, smoothPath } from '~/utils/chart'
import { MOODS } from '~/utils/mood'

export interface LinePoint {
  id: string
  /** 0–1 across the plot. */
  x: number
  /** Value on the y scale (score or average). */
  v: number
  color: string
  /** Dot diameter and dark halo border, px (the design's content-box sizes). */
  size: number
  border: number
  /** Diameter while hovered; defaults to `size`. */
  hoverSize?: number
  /** Thin coloured ring around the halo (Today's points). */
  ring?: boolean
  /** Accessible name: everything the tooltip shows. */
  label: string
  tooltip: TooltipContent
}

const props = withDefaults(defineProps<{
  /** Plot height in px; the SVG is drawn 1000 wide by this and stretched. */
  height?: number
  line: readonly { x: number, v: number }[]
  /** Soft fill under the line (Today). */
  area?: boolean
  /** Shaded range around the line (min/max, percentiles). */
  band?: readonly { x: number, lo: number, hi: number }[]
  /** Dashed horizontal line at the period average. */
  average?: number | null
  points: readonly LinePoint[]
  ticks: readonly AxisTick[]
  /** Faint vertical separators (0–1). */
  dividers?: readonly number[]
  yTicks?: readonly number[]
  /** Value → SVG y; defaults to the 1–10 score scale. */
  yFor?: (v: number) => number
  /** Accessible summary of the whole chart. */
  description: string
  /** Shown over the plot when there are no points. */
  emptyLabel?: string
}>(), {
  height: 220,
  area: false,
  band: () => [],
  average: null,
  dividers: () => [],
  yTicks: () => [10, 7, 4, 1],
  yFor: undefined,
})

defineSlots<{
  /** Inside the SVG, above the gridlines and below the line. Receives the drawing helpers. */
  under?: (props: { width: number, height: number, toY: (v: number) => number }) => unknown
  /** HTML layered over the plot (markers, labels). */
  overlay?: () => unknown
  /** Extra content inside a point button (e.g. a pulse ring). */
  point?: (props: { point: LinePoint }) => unknown
  /** Below the x axis (lanes). */
  default?: () => unknown
}>()

const W = 1000
// Design tooltip: 260px content + 2×14px padding + 2×1px border.
const TOOLTIP_WIDTH = 290

const uid = useId()
const lineGradient = `${uid}-line`
const areaGradient = `${uid}-area`

const toY = (v: number) => (props.yFor ? props.yFor(v) : scoreToY(v, props.height))
const pct = (n: number) => `${n}%`
const topPct = (v: number) => pct((toY(v) / props.height) * 100)

const linePath = computed(() => smoothPath(props.line.map(p => [p.x * W, toY(p.v)] as const)))
const areaPath = computed(() => {
  if (!props.area || !linePath.value) return ''
  const first = props.line[0]!.x * W
  const last = props.line.at(-1)!.x * W
  return `${linePath.value} L${last.toFixed(1)},${props.height} L${first.toFixed(1)},${props.height} Z`
})
const bandPath = computed(() => {
  if (props.band.length < 2) return ''
  const hi = smoothPath(props.band.map(b => [b.x * W, toY(b.hi)] as const))
  const lo = smoothPath([...props.band].reverse().map(b => [b.x * W, toY(b.lo)] as const))
  return `${hi} L${lo.slice(1)} Z`
})

// ── Hover / focus tooltip ──────────────────────────────────────────────
const plot = useTemplateRef<HTMLElement>('plot')
const plotWidth = ref(0)
const hoverId = ref<string | null>(null)

function show(id: string) {
  plotWidth.value = plot.value?.clientWidth ?? 0
  hoverId.value = id
}

const tooltip = computed(() => {
  const point = props.points.find(p => p.id === hoverId.value)
  if (!point || !plotWidth.value) return null
  const width = Math.min(TOOLTIP_WIDTH, plotWidth.value)
  return {
    ...point.tooltip,
    x: `${placeTooltip(point.x * plotWidth.value, plotWidth.value, width)}px`,
    y: topPct(point.v),
    // High points open downwards, low points upwards (as designed).
    transform: `translateY(${point.v > 6 ? '-10%' : '-90%'})`,
  }
})
</script>

<template>
  <div class="line-chart">
    <div
      class="line-chart__y"
      :style="{ height: `${height}px` }"
      aria-hidden="true"
    >
      <span
        v-for="tick in yTicks"
        :key="tick"
        :style="{ top: topPct(tick) }"
      >{{ tick }}</span>
    </div>

    <div
      ref="plot"
      class="line-chart__plot"
      :style="{ height: `${height}px` }"
      @mouseleave="hoverId = null"
    >
      <svg
        class="line-chart__svg"
        :viewBox="`0 0 ${W} ${height}`"
        preserveAspectRatio="none"
        role="img"
        :aria-label="description"
      >
        <defs>
          <linearGradient
            :id="lineGradient"
            x1="0"
            :y1="height"
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
            v-if="area"
            :id="areaGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0"
              class="line-chart__area-stop line-chart__area-stop--top"
            />
            <stop
              offset="1"
              class="line-chart__area-stop"
            />
          </linearGradient>
        </defs>

        <line
          v-for="tick in yTicks"
          :key="tick"
          class="line-chart__grid"
          x1="0"
          :x2="W"
          :y1="toY(tick)"
          :y2="toY(tick)"
        />
        <line
          v-for="x in dividers"
          :key="x"
          class="line-chart__divider"
          :x1="x * W"
          :x2="x * W"
          y1="0"
          :y2="height"
        />
        <slot
          name="under"
          :width="W"
          :height="height"
          :to-y="toY"
        />
        <path
          v-if="bandPath"
          class="line-chart__band"
          :d="bandPath"
        />
        <line
          v-if="average != null"
          class="line-chart__average"
          x1="0"
          :x2="W"
          :y1="toY(average)"
          :y2="toY(average)"
        />
        <path
          v-if="areaPath"
          :d="areaPath"
          :fill="`url(#${areaGradient})`"
        />
        <path
          v-if="linePath"
          class="line-chart__line"
          :d="linePath"
          :stroke="`url(#${lineGradient})`"
        />
      </svg>

      <p
        v-if="emptyLabel && !points.length"
        class="line-chart__empty"
      >
        {{ emptyLabel }}
      </p>

      <slot name="overlay" />

      <button
        v-for="point in points"
        :key="point.id"
        type="button"
        class="line-chart__point"
        :class="{ 'is-hovered': point.id === hoverId, 'has-ring': point.ring }"
        :style="{
          'left': pct(point.x * 100),
          'top': topPct(point.v),
          '--mood': point.color,
          '--dot-size': `${point.size}px`,
          '--dot-hover-size': `${point.hoverSize ?? point.size}px`,
          '--dot-border': `${point.border}px`,
        }"
        :aria-label="point.label"
        @mouseenter="show(point.id)"
        @focus="show(point.id)"
        @blur="hoverId = null"
      >
        <slot
          name="point"
          :point="point"
        />
        <span class="line-chart__dot" />
      </button>

      <ChartTooltip
        v-if="tooltip"
        v-bind="tooltip"
      />
    </div>

    <div
      class="line-chart__x"
      aria-hidden="true"
    >
      <span
        v-for="tick in ticks"
        :key="`${tick.x}-${tick.label}`"
        class="line-chart__x-label"
        :class="[`is-${tick.align}`, { 'is-minor': tick.minor }]"
        :style="{ left: tick.align === 'end' ? undefined : pct(tick.x * 100) }"
      >{{ tick.label }}</span>
    </div>

    <slot />
  </div>
</template>
