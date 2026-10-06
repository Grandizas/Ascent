<script setup lang="ts">
import type { MoodEntry, MoodEntryPatch } from '~/types/mood'
import { formatTime } from '~/utils/date'
import { getMood } from '~/utils/mood'

const props = defineProps<{
  entry: MoodEntry
  timeZone: string
  tagOptions: readonly string[]
}>()

const emit = defineEmits<{
  update: [patch: MoodEntryPatch]
  undo: []
  done: []
}>()

const mood = computed(() => getMood(props.entry.level))
const noteField = useTemplateRef<HTMLTextAreaElement>('note')

const score = computed({
  get: () => props.entry.score,
  set: score => emit('update', { score }),
})

const tags = computed({
  get: () => props.entry.tags,
  set: tags => emit('update', { tags }),
})

function onNoteKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    noteField.value?.blur()
    emit('done')
  }
}

defineExpose({ focusNote: () => noteField.value?.focus() })
</script>

<template>
  <div
    class="mood-log"
    :style="{ '--mood': mood.color }"
  >
    <div class="mood-log__status">
      <p class="mood-log__summary">
        <MoodDot
          :color="mood.color"
          glow
        />
        <span>Logged at <span class="t-mono">{{ formatTime(entry.loggedAt, timeZone) }}</span></span>
        <span class="mood-log__sep">·</span>
        <span class="mood-log__mood">{{ mood.label }} {{ entry.score }}/10</span>
      </p>
      <div class="mood-log__actions">
        <BaseButton
          size="xs"
          @click="emit('undo')"
        >
          Undo
        </BaseButton>
        <BaseButton
          variant="primary"
          size="xs"
          kbd="ESC"
          @click="emit('done')"
        >
          Done
        </BaseButton>
      </div>
    </div>

    <div class="mood-log__fields">
      <span class="mood-log__label">Intensity</span>
      <IntensityScale
        v-model="score"
        :color="mood.color"
      />

      <span class="mood-log__label mood-log__label--top">Context</span>
      <TagPicker
        v-model="tags"
        :options="tagOptions"
      />

      <label
        class="mood-log__label mood-log__label--note"
        for="mood-log-note"
      >Note</label>
      <div class="mood-log__note">
        <textarea
          id="mood-log-note"
          ref="note"
          class="mood-log__textarea"
          rows="2"
          placeholder="What's happening? Optional."
          :value="entry.note"
          @input="emit('update', { note: ($event.target as HTMLTextAreaElement).value })"
          @keydown="onNoteKeydown"
        />
        <KeyHint
          variant="boxed"
          class="mood-log__note-key"
        >
          N
        </KeyHint>
      </div>
    </div>
  </div>
</template>
