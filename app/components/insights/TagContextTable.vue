<script setup lang="ts">
import { tagBars, type TagStat } from '~/utils/analytics/insights'

const props = defineProps<{ tags: readonly TagStat[] }>()

const selected = defineModel<string | null>({ required: true })

const rows = computed(() => {
  const bars = tagBars(props.tags)
  return props.tags.map((tag, i) => ({ ...bars[i]!, entries: tag.entries }))
})
const percent = (share: number) => `${share * 100}%`
</script>

<template>
  <div class="tag-table">
    <div
      class="tag-table__head"
      aria-hidden="true"
    >
      <span />
      <span class="tag-table__lower-head">Lower</span>
      <span class="tag-table__higher-head">Higher</span>
      <span class="tag-table__count">Entries</span>
    </div>
    <button
      v-for="row in rows"
      :key="row.tag"
      type="button"
      class="tag-table__row"
      :class="[`is-evidence-${row.level}`, { 'is-selected': row.tag === selected }]"
      :aria-pressed="row.tag === selected"
      :aria-label="`${row.tag}: ${(row.higher ?? row.lower)?.label ?? '0.0'} against your average, ${row.entries} entries`"
      @click="selected = row.tag"
    >
      <span class="tag-table__name">{{ row.tag }}</span>
      <span class="tag-table__lower">
        <span class="tag-table__value">{{ row.lower?.label }}</span>
        <span
          class="tag-table__bar"
          :style="{ width: row.lower ? percent(row.lower.width) : '0px' }"
        />
      </span>
      <span class="tag-table__higher">
        <span
          class="tag-table__bar"
          :style="{ width: row.higher ? percent(row.higher.width) : '0px' }"
        />
        <span class="tag-table__value">{{ row.higher?.label }}</span>
      </span>
      <span class="tag-table__count">{{ row.entries }}</span>
    </button>
    <p
      v-if="!rows.length"
      class="tag-table__empty"
    >
      No tag has been used five times in this range yet.
    </p>
  </div>
</template>
