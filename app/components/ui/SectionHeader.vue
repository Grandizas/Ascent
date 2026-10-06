<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  title: string
  description?: string
  /** Serif H2 size; the design uses 22, 26, 28 and 30px. */
  titleSize?: 22 | 26 | 28 | 30
  as?: 'h2' | 'h3'
}>(), { titleSize: 28, as: 'h2' })
</script>

<template>
  <div class="section-header">
    <SectionLabel v-if="label">
      {{ label }}
    </SectionLabel>
    <component
      :is="as"
      class="section-header__title"
      :class="`section-header__title--${titleSize}`"
    >
      {{ title }}
    </component>
    <p
      v-if="description"
      class="section-header__description"
    >
      {{ description }}
    </p>
  </div>
</template>
