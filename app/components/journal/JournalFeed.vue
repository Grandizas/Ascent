<script setup lang="ts">
import type { JournalBlock } from '~/utils/analytics/journal'

defineProps<{
  blocks: readonly JournalBlock[]
  timeZone: string
  /** Shown when there are no blocks. */
  emptyText: string
  hasMore: boolean
  loadingMore?: boolean
  /** Shown under the list when loading failed. */
  error?: string
}>()

const emit = defineEmits<{ more: [], tag: [tag: string] }>()
</script>

<template>
  <div class="journal-feed">
    <template
      v-for="block in blocks"
      :key="block.day"
    >
      <JournalMonthHeader
        v-if="block.month"
        :label="block.month.label"
        :summary="block.month.summary"
      />
      <JournalDay
        :block="block"
        :time-zone="timeZone"
        @tag="emit('tag', $event)"
      />
    </template>
    <p
      v-if="!blocks.length"
      class="journal-feed__empty"
    >
      {{ emptyText }}
    </p>
    <BaseButton
      v-if="hasMore"
      class="journal-feed__more"
      size="2xl"
      block
      :loading="loadingMore"
      @click="emit('more')"
    >
      Show earlier days
    </BaseButton>
    <p
      v-if="error"
      class="journal-feed__error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>
