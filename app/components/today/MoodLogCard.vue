<script setup lang="ts">
import type { MoodEntry, MoodEntryPatch } from '~/types/mood'
import type { MoodLevel } from '~/utils/mood'

defineProps<{
  current: MoodEntry | null
  pulseKey: number
  timeZone: string
  tagOptions: readonly string[]
}>()

const emit = defineEmits<{
  pick: [level: MoodLevel]
  update: [patch: MoodEntryPatch]
  undo: []
  done: []
}>()

const panel = useTemplateRef<{ focusNote: () => void }>('panel')
defineExpose({ focusNote: () => panel.value?.focusNote() })
</script>

<template>
  <BaseCard
    class="mood-log-card"
    pad="none"
    aria-labelledby="mood-log-card-title"
  >
    <div class="mood-log-card__head">
      <SectionLabel size="md">
        Current state
      </SectionLabel>
      <span class="mood-log-card__hint">
        Press <KeyHint variant="boxed">1</KeyHint>–<KeyHint variant="boxed">5</KeyHint> anywhere
      </span>
    </div>
    <h2
      id="mood-log-card-title"
      class="mood-log-card__title"
    >
      How do you feel right now?
    </h2>

    <MoodPicker
      :selected="current?.level"
      :pulse-key="pulseKey"
      @pick="emit('pick', $event)"
    />

    <MoodLogPanel
      v-if="current"
      ref="panel"
      :entry="current"
      :time-zone="timeZone"
      :tag-options="tagOptions"
      @update="emit('update', $event)"
      @undo="emit('undo')"
      @done="emit('done')"
    />
  </BaseCard>
</template>
