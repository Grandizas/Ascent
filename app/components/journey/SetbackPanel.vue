<script setup lang="ts">
import type { SetbackOutcome } from '~/types/journey'

// Not in the design (PLAN.md Q6): extrapolated from the composer and wizard styles.
defineProps<{
  /** The day the attempt is on. */
  day: number
  /** The number a restart would get. */
  nextAttempt: number
  saving?: boolean
  error?: string
}>()

const emit = defineEmits<{ record: [outcome: SetbackOutcome, note: string], cancel: [] }>()

const note = ref('')
const field = useTemplateRef<HTMLTextAreaElement>('field')
onMounted(() => field.value?.focus())
</script>

<template>
  <BaseCard
    class="journey-panel"
    aria-labelledby="setback-title"
  >
    <span
      id="setback-title"
      class="journey-section__label"
    >Record a setback</span>
    <textarea
      ref="field"
      v-model="note"
      class="journey-panel__note"
      rows="3"
      maxlength="2000"
      placeholder="What happened? Optional, only for you."
      aria-label="What happened?"
    />
    <div class="journey-panel__choices">
      <button
        type="button"
        class="journey-choice"
        :disabled="saving"
        @click="emit('record', 'continued', note)"
      >
        <span class="journey-choice__title">Keep climbing</span>
        <span class="journey-choice__text">Log it and carry on. Day {{ day }} stays Day {{ day }}.</span>
      </button>
      <button
        type="button"
        class="journey-choice"
        :disabled="saving"
        @click="emit('record', 'restarted', note)"
      >
        <span class="journey-choice__title">Start attempt #{{ nextAttempt }}</span>
        <span class="journey-choice__text">End this attempt on Day {{ day }} and begin again at Day 1. It stays in your history.</span>
      </button>
    </div>
    <p
      v-if="error"
      class="journey-panel__error"
      role="alert"
    >
      {{ error }}
    </p>
    <div class="journey-panel__actions">
      <BaseButton
        size="sm"
        :disabled="saving"
        @click="emit('cancel')"
      >
        Cancel
      </BaseButton>
    </div>
  </BaseCard>
</template>
