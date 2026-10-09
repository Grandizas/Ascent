<script setup lang="ts">
import { TIMELINE_RANGES, type TimelineRange } from '~/utils/analytics/timeline'

defineProps<{
  canGoOlder: boolean
  canGoNewer: boolean
}>()

const range = defineModel<TimelineRange>('range', { required: true })
const emit = defineEmits<{ older: [], newer: [] }>()
</script>

<template>
  <div class="period-nav">
    <div class="period-nav__steps">
      <BaseButton
        variant="icon"
        size="sm"
        :disabled="!canGoOlder"
        aria-label="Earlier period"
        aria-keyshortcuts="ArrowLeft"
        @click="emit('older')"
      >
        <AppIcon name="arrow-left" />
      </BaseButton>
      <BaseButton
        variant="icon"
        size="sm"
        :disabled="!canGoNewer"
        aria-label="Later period"
        aria-keyshortcuts="ArrowRight"
        @click="emit('newer')"
      >
        <AppIcon name="arrow-right" />
      </BaseButton>
    </div>
    <SegmentedControl
      v-model="range"
      :options="TIMELINE_RANGES"
      label="Period"
    />
  </div>
</template>
