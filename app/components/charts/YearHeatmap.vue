<script setup lang="ts">
import type { HeatmapModel } from '~/utils/analytics/timelineChart'
import { moodColorContinuous } from '~/utils/mood'

const props = defineProps<{
  model: HeatmapModel
  year: number
}>()

// Monday-first rows; every other label, as designed.
const WEEKDAYS = ['M', '', 'W', '', 'F', '', 'S']
const LEGEND = [2.5, 4, 5.5, 7, 8.5].map(moodColorContinuous)
// Design tooltip: 260px content + 2×14px padding + 2×1px border.
const TOOLTIP_WIDTH = 290

const grid = useTemplateRef<HTMLElement>('grid')
const hover = ref<{ index: number, x: number, y: number, width: number } | null>(null)

function show(index: number, event: MouseEvent) {
  const box = grid.value?.getBoundingClientRect()
  const cell = (event.currentTarget as HTMLElement).getBoundingClientRect()
  if (!box) return
  hover.value = { index, x: cell.left - box.left + cell.width / 2, y: cell.top - box.top + cell.height / 2, width: box.width }
}

const tooltip = computed(() => {
  const h = hover.value
  const content = h && props.model.cells[h.index]?.tooltip
  if (!h || !content) return null
  const width = Math.min(TOOLTIP_WIDTH, h.width)
  // As designed: right of the cell (16px) up to 62% across, else left (10px); kept inside the grid.
  const preferred = h.x / h.width > 0.62 ? h.x - 10 - width : h.x + 16
  const left = Math.min(Math.max(0, preferred), h.width - width)
  return { ...content, x: `${left}px`, y: `${h.y}px`, transform: 'translateY(-40%)' }
})

const daysLogged = computed(() => props.model.cells.filter(c => c.stat).length)
</script>

<template>
  <div class="heatmap">
    <div
      class="heatmap__months"
      aria-hidden="true"
    >
      <span
        v-for="month in model.months"
        :key="month.label"
        :style="{ left: `${(month.column / model.columns) * 100}%` }"
      >{{ month.label }}</span>
    </div>

    <div class="heatmap__body">
      <div
        class="heatmap__weekdays"
        aria-hidden="true"
      >
        <span
          v-for="(day, i) in WEEKDAYS"
          :key="i"
        >{{ day }}</span>
      </div>
      <p class="visually-hidden">
        {{ year }}: mood logged on {{ daysLogged }} days. Each square is a day, coloured by its average mood.
      </p>
      <div
        ref="grid"
        class="heatmap__grid"
        aria-hidden="true"
        @mouseleave="hover = null"
      >
        <span
          v-for="(cell, index) in model.cells"
          :key="index"
          class="heatmap__cell"
          :class="{ 'is-outside': !cell.day, 'is-empty': cell.day && !cell.color, 'is-today': cell.isToday }"
          :style="cell.color ? { background: cell.color } : undefined"
          @mouseenter="cell.stat && show(index, $event)"
        />
        <ChartTooltip
          v-if="tooltip"
          v-bind="tooltip"
        />
      </div>
    </div>

    <div class="heatmap__legend">
      Lower
      <span
        v-for="color in LEGEND"
        :key="color"
        class="heatmap__swatch"
        :style="{ background: color }"
      />
      Higher
    </div>
  </div>
</template>
