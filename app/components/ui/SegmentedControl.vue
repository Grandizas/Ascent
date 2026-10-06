<script setup lang="ts" generic="T extends string | number">
export interface SegmentedOption<V> {
  value: V
  label: string
  /** Keycap letter shown after the label (mono variant). */
  shortcut?: string
}

withDefaults(defineProps<{
  options: readonly SegmentedOption<T>[]
  /** Accessible name for the group. */
  label: string
  /**
   * mono — uppercase Geist Mono, 28px (Timeline, Insights, Year review)
   * sans — Geist 12.5px, 26px (Journal)
   */
  variant?: 'mono' | 'sans'
}>(), { variant: 'mono' })

const model = defineModel<T>({ required: true })
</script>

<template>
  <div
    class="segmented"
    :class="`segmented--${variant}`"
    role="group"
    :aria-label="label"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      class="segmented__item"
      :class="{ 'is-selected': option.value === model }"
      :aria-pressed="option.value === model"
      @click="model = option.value"
    >
      {{ option.label }}
      <span
        v-if="option.shortcut"
        class="segmented__key"
        aria-hidden="true"
      >{{ option.shortcut }}</span>
    </button>
  </div>
</template>
