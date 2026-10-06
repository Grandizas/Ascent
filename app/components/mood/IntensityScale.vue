<script setup lang="ts">
defineProps<{
  /** Color of the selected value (the entry's mood). */
  color: string
}>()

const score = defineModel<number>({ required: true })
const VALUES = Array.from({ length: 10 }, (_, i) => i + 1)
</script>

<template>
  <div
    class="intensity"
    role="radiogroup"
    aria-label="Intensity"
    :style="{ '--mood': color }"
  >
    <button
      v-for="value in VALUES"
      :key="value"
      type="button"
      role="radio"
      class="intensity__value"
      :class="{ 'is-selected': value === score }"
      :aria-checked="value === score"
      @click="score = value"
    >
      {{ value }}
    </button>
  </div>
</template>
