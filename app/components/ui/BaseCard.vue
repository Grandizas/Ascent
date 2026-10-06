<script setup lang="ts">
withDefaults(defineProps<{
  as?: string
  /** sm 18/20 · md 20/22 · lg 22/24 — the three paddings used by cards in the design. */
  pad?: 'none' | 'sm' | 'md' | 'lg'
}>(), { as: 'section', pad: 'md' })
</script>

<template>
  <component
    :is="as"
    class="card"
    :class="`card--pad-${pad}`"
  >
    <slot />
  </component>
</template>
