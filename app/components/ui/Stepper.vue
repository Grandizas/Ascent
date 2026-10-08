<script setup lang="ts">
defineProps<{
  steps: readonly string[]
  /** 1-based. */
  current: number
  /** Accessible name for the list. */
  label?: string
}>()
</script>

<template>
  <ol
    class="stepper"
    :aria-label="label ?? 'Progress'"
  >
    <li
      v-for="(step, index) in steps"
      :key="step"
      class="stepper__step"
      :class="{ 'is-done': index + 1 < current, 'is-current': index + 1 === current }"
      :aria-current="index + 1 === current ? 'step' : undefined"
    >
      <span
        class="stepper__dot"
        aria-hidden="true"
      />
      <span class="stepper__label">{{ step }}</span>
      <span
        v-if="index < steps.length - 1"
        class="stepper__line"
        aria-hidden="true"
      />
    </li>
  </ol>
</template>
