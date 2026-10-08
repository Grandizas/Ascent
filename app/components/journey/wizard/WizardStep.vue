<script setup lang="ts">
withDefaults(defineProps<{
  /** 1-based. */
  step: number
  total?: number
  title: string
  description?: string
  /** Space between blocks: 18px for writing steps, 22px for rules and floors. */
  spacing?: 'tight' | 'loose'
}>(), { total: 4, spacing: 'tight' })
</script>

<template>
  <section
    class="wizard-step"
    :class="`wizard-step--${spacing}`"
    :aria-labelledby="`wizard-step-${step}`"
  >
    <span class="wizard-step__count">Step {{ step }} of {{ total }}</span>
    <h1
      :id="`wizard-step-${step}`"
      class="wizard-step__title"
    >
      {{ title }}
    </h1>
    <p
      v-if="description"
      class="wizard-step__description"
    >
      {{ description }}
    </p>
    <slot />
    <div class="wizard-step__actions">
      <slot name="actions" />
    </div>
  </section>
</template>
