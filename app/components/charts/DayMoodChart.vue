<script setup lang="ts">
import type { LinePoint } from '~/components/charts/MoodLineChart.vue'
import type { ChartLane } from '~/types/chart'
import type { MoodEntry } from '~/types/mood'
import { dayAxisPosition, dayAxisStart, dayAxisTicks, smoothPath } from '~/utils/chart'
import { formatClock, minuteOfDay } from '~/utils/date'
import { getMood } from '~/utils/mood'

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

const minuteOf = (entry: MoodEntry) => minuteOfDay(entry.loggedAt, props.timeZone)
const byTime = (list: readonly MoodEntry[]) => [...list].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))

// 06:00–24:00 as designed; starts earlier only if something happened before 06:00.
const axisStart = computed(() => dayAxisStart([
  ...props.entries.map(minuteOf),
  ...(props.showComparison && props.comparison ? props.comparison.map(minuteOf) : []),
  ...(props.nowMinute == null ? [] : [props.nowMinute]),
]))
const xOf = (entry: MoodEntry) => dayAxisPosition(minuteOf(entry), axisStart.value)

const points = computed<LinePoint[]>(() => byTime(props.entries).map((entry) => {
  const mood = getMood(entry.level)
  const time = formatClock(minuteOf(entry))
  // Accessible name carries what the tooltip shows: "Low 4/10 at 10:12. <note> Tags: Work, Gym."
  const note = entry.note.trim()
  const label = [
    `${mood.label} ${entry.score}/10 at ${time}.`,
    note && (/[.!?…]$/.test(note) ? note : `${note}.`),
    entry.tags.length ? `Tags: ${entry.tags.join(', ')}.` : '',
  ].filter(Boolean).join(' ')
  return {
    id: entry.id,
    x: xOf(entry),
    v: entry.score,
    color: mood.color,
    size: 9,
    hoverSize: 12,
    border: 2,
    ring: true,
    label,
    tooltip: { color: mood.color, title: mood.label, value: `${entry.score}/10`, meta: time, body: note || 'No note', sub: entry.tags.join(' · ') || 'No tags' },
  }
}))

const nowX = computed(() => (props.nowMinute == null ? null : dayAxisPosition(props.nowMinute, axisStart.value)))

const laneMarks = computed(() => {
  const lane = props.lane
  if (!lane) return []
  return points.value
    .filter(p => props.entries.find(e => e.id === p.id)?.tags.includes(lane.tag))
    .map(p => ({ id: p.id, left: `${p.x * 100}%`, title: `${lane.itemLabel} ${p.tooltip.meta}` }))
})

const description = computed(() => {
  const n = points.value.length
  return n ? `Mood through the day: ${n} check-in${n === 1 ? '' : 's'}.` : 'No check-ins yet today.'
})
</script>

<template>
  <MoodLineChart
    class="day-chart"
    :line="points"
    area
    :points="points"
    :ticks="dayAxisTicks(axisStart)"
    :description="description"
  >
    <template #under="{ width, height, toY }">
      <rect
        v-if="nowX != null"
        class="day-chart__future"
        :x="nowX * width"
        y="0"
        :width="Math.max(0, width - nowX * width)"
        :height="height"
      />
      <path
        v-if="showComparison && comparison?.length"
        class="day-chart__comparison"
        :d="smoothPath(byTime(comparison).map(e => [xOf(e) * width, toY(e.score)] as const))"
      />
    </template>

    <template #overlay>
      <div
        v-if="nowX != null && nowMinute != null"
        class="day-chart__now"
        :style="{ left: `${nowX * 100}%` }"
      >
        <span class="day-chart__now-label">Now {{ formatClock(nowMinute) }}</span>
      </div>
    </template>

    <template #point="{ point }">
      <span
        v-if="point.id === freshId"
        :key="pulseKey"
        class="day-chart__ring"
      />
    </template>

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
  </MoodLineChart>
</template>
