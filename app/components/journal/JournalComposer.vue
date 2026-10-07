<script setup lang="ts">
import { formatWordCount, wordCount } from '~/utils/analytics/journal'

defineProps<{
  /** "Today · 20:43 · Nicotine-free day 12" (shown uppercase). */
  label: string
  saving?: boolean
  /** Save failure; the draft is kept. */
  error?: string
}>()

const emit = defineEmits<{ save: [], discard: [] }>()

const draft = defineModel<string>({ required: true })
const words = computed(() => formatWordCount(wordCount(draft.value)))

const field = useTemplateRef<HTMLTextAreaElement>('field')
defineExpose({ focus: () => field.value?.focus() })
</script>

<template>
  <BaseCard
    class="journal-composer"
    aria-label="Write something longer"
  >
    <div class="journal-composer__head">
      <span class="journal-composer__label">{{ label }}</span>
      <span class="journal-composer__words">{{ words }}</span>
    </div>
    <textarea
      ref="field"
      v-model="draft"
      class="journal-composer__field"
      rows="6"
      maxlength="20000"
      placeholder="No prompt. Write what's on your mind."
      aria-label="Longer entry"
    />
    <p
      v-if="error"
      class="journal-composer__error"
      role="alert"
    >
      {{ error }}
    </p>
    <div class="journal-composer__actions">
      <BaseButton
        size="sm"
        :disabled="saving"
        @click="emit('discard')"
      >
        Discard
      </BaseButton>
      <BaseButton
        variant="primary"
        size="sm"
        :loading="saving"
        @click="emit('save')"
      >
        Save to today
      </BaseButton>
    </div>
  </BaseCard>
</template>
