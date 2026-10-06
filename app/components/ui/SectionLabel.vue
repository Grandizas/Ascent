<script setup lang="ts">
withDefaults(defineProps<{
  as?: string
  /** sm — 10.5px #6E6C68 (most pages) · md — 11px #7C7A75 (Today). */
  size?: 'sm' | 'md'
}>(), { as: 'span', size: 'sm' })
</script>

<template>
  <component
    :is="as"
    class="section-label"
    :class="`section-label--${size}`"
  >
    <slot />
  </component>
</template>
