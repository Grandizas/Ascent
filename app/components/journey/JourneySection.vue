<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  title: string
  /** The dimmer title used for "Why you're doing this". */
  muted?: boolean
  /** Space between blocks, per the design's sections. */
  spacing?: 'notes' | 'regular' | 'why'
}>(), { spacing: 'regular' })

const id = useId()
</script>

<template>
  <section
    class="journey-section"
    :class="`journey-section--${spacing}`"
    :aria-labelledby="id"
  >
    <span class="journey-section__label">{{ label }}</span>
    <h2
      :id="id"
      class="journey-section__title"
      :class="{ 'is-muted': muted }"
    >
      {{ title }}
    </h2>
    <slot />
  </section>
</template>
