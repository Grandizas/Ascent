<script setup lang="ts">
import { evidenceText, formatSigned, type TagStat } from '~/utils/analytics/insights'
import { dayKey, formatMonthDay, formatTime } from '~/utils/date'

const props = defineProps<{
  tag: TagStat
  timeZone: string
}>()

const after = computed(() => {
  const { after: change, up, cases } = props.tag
  if (change === null) return { value: '—', tone: '', label: 'not enough before/after pairs' }
  return { value: formatSigned(change), tone: change >= 0 ? 'is-positive' : 'is-negative', label: `change over the next 4 hours (${up} of ${cases} times up)` }
})
const when = (at: string) => `${formatMonthDay(dayKey(at, props.timeZone))} ${formatTime(at, props.timeZone)}`
</script>

<template>
  <BaseCard
    class="tag-detail"
    pad="lg"
    aria-labelledby="tag-detail-title"
  >
    <div class="tag-detail__head">
      <h3
        id="tag-detail-title"
        class="tag-detail__title"
      >
        #{{ tag.tag }}
      </h3>
      <span class="tag-detail__evidence">{{ evidenceText(tag.entries) }}</span>
    </div>
    <div class="tag-detail__stats">
      <div class="tag-detail__stat">
        <span class="tag-detail__value">{{ tag.withAverage.toFixed(1) }}</span>
        <span class="tag-detail__label">average when tagged</span>
      </div>
      <div class="tag-detail__stat">
        <span class="tag-detail__value is-muted">{{ tag.withoutAverage === null ? '—' : tag.withoutAverage.toFixed(1) }}</span>
        <span class="tag-detail__label">average otherwise</span>
      </div>
      <div class="tag-detail__stat">
        <span
          class="tag-detail__value"
          :class="after.tone"
        >{{ after.value }}</span>
        <span class="tag-detail__label">{{ after.label }}</span>
      </div>
    </div>
    <div
      v-if="tag.notes.length"
      class="tag-detail__notes"
    >
      <div
        v-for="note in tag.notes"
        :key="note.id"
        class="tag-detail__note"
      >
        <span class="tag-detail__when">{{ when(note.loggedAt) }}</span>
        <span class="tag-detail__text">“{{ note.note }}”</span>
        <span class="tag-detail__score">{{ note.score }}/10</span>
      </div>
    </div>
  </BaseCard>
</template>
