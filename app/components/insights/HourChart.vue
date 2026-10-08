<script setup lang="ts">
import type { LinePoint } from '~/components/charts/MoodLineChart.vue'
import { FIRST_HOUR, hourChartY, type HourStat, hourX, LAST_HOUR } from '~/utils/analytics/insights'
import type { AxisTick } from '~/utils/chart'
import { moodColorContinuous } from '~/utils/mood'

const props = defineProps<{
  hours: readonly HourStat[]
  average: number | null
}>()

const HEIGHT = 200
const Y_TICKS = [8, 5.5, 3]
const LABELLED_HOURS = [7, 10, 13, 16, 19, 22]
const SPAN = LAST_HOUR + 1 - FIRST_HOUR

const clock = (hour: number) => `${String(hour).padStart(2, '0')}:00`
const yFor = (v: number) => hourChartY(v, HEIGHT)

const extremes = computed(() => {
  if (!props.hours.length) return null
  const sorted = [...props.hours].sort((a, b) => a.average - b.average)
  return { low: sorted[0]!, high: sorted.at(-1)! }
})

const points = computed<LinePoint[]>(() => props.hours.map((h) => {
  const extreme = h === extremes.value?.low || h === extremes.value?.high
  const body = `${h.entries} ${h.entries === 1 ? 'entry' : 'entries'} · middle half ${h.q1}–${h.q3}`
  return {
    id: String(h.hour),
    x: hourX(h.hour),
    v: h.average,
    color: moodColorContinuous(h.average),
    size: extreme ? 10 : 6,
    border: 2,
    label: `${clock(h.hour)}, average ${h.average.toFixed(1)}, ${body}.`,
    tooltip: { color: moodColorContinuous(h.average), title: clock(h.hour), value: h.average.toFixed(1), body },
  }
}))

const ticks: AxisTick[] = LABELLED_HOURS.map(hour => ({ x: (hour - FIRST_HOUR) / SPAN, label: clock(hour), minor: false, align: 'center' }))

// "Lowest 11:00 · 4.9" below its point, "Highest 20:00 · 6.4" above; flipped left near the right edge.
const callouts = computed(() => {
  if (!extremes.value) return []
  return [
    { hour: extremes.value.low, word: 'Lowest', tone: 'low', above: false },
    { hour: extremes.value.high, word: 'Highest', tone: 'high', above: true },
  ].map(({ hour, word, tone, above }) => ({
    key: word,
    tone,
    text: `${word} ${clock(hour.hour)} · ${hour.average.toFixed(1)}`,
    style: {
      left: `${hourX(hour.hour) * 100}%`,
      top: `${(yFor(hour.average) / HEIGHT) * 100}%`,
      transform: `translate(${hourX(hour.hour) > 0.7 ? '-100%' : '-50%'}, ${above ? '-170%' : '70%'})`,
    },
  }))
})

const description = computed(() => (props.hours.length
  ? `Mood by hour: ${props.hours.map(h => `${clock(h.hour)} ${h.average.toFixed(1)}`).join(', ')}.`
  : 'Mood by hour: not enough check-ins yet.'))
</script>

<template>
  <MoodLineChart
    class="hour-chart"
    :height="HEIGHT"
    :line="hours.map(h => ({ x: hourX(h.hour), v: h.average }))"
    :band="hours.length > 2 ? hours.map(h => ({ x: hourX(h.hour), lo: h.q1, hi: h.q3 })) : []"
    :average="average"
    :points="points"
    :ticks="ticks"
    :y-ticks="Y_TICKS"
    :y-for="yFor"
    :description="description"
    empty-label="Not enough check-ins at any hour yet."
  >
    <template #overlay>
      <span
        v-for="callout in callouts"
        :key="callout.key"
        class="hour-chart__callout"
        :class="`is-${callout.tone}`"
        :style="callout.style"
        aria-hidden="true"
      >{{ callout.text }}</span>
    </template>
  </MoodLineChart>
</template>
