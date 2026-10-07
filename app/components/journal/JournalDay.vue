<script setup lang="ts">
import type { JournalBlock } from '~/utils/analytics/journal'

defineProps<{
  block: JournalBlock
  timeZone: string
}>()

const emit = defineEmits<{ tag: [tag: string] }>()
</script>

<template>
  <article
    class="journal-day"
    :aria-labelledby="`day-${block.day}`"
  >
    <div class="journal-day__rail">
      <span class="journal-day__weekday">{{ block.weekday }}</span>
      <h3
        :id="`day-${block.day}`"
        class="journal-day__date"
      >
        {{ block.date }}
      </h3>
      <MiniMoodBars
        v-if="block.checkIns.length"
        class="journal-day__bars"
        :entries="block.checkIns"
      />
      <span
        v-if="block.summary"
        class="journal-day__summary"
      >{{ block.summary }}</span>
      <span
        v-for="chip in block.chips"
        :key="chip.id"
        class="journal-day__journey"
        :class="{ 'is-active': chip.active }"
      >{{ chip.label }}</span>
    </div>
    <div class="journal-day__items">
      <template
        v-for="item in block.items"
        :key="item.key"
      >
        <JournalEvent
          v-if="item.kind === 'event'"
          :event="item.event"
        />
        <JournalLongEntry
          v-else-if="item.kind === 'long'"
          :entry="item.entry"
          :time-zone="timeZone"
        />
        <JournalCheckIn
          v-else
          :entry="item.entry"
          :time-zone="timeZone"
          @tag="emit('tag', $event)"
        />
      </template>
    </div>
  </article>
</template>
