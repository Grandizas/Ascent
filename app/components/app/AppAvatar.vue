<script setup lang="ts">
withDefaults(defineProps<{
  initials: string
  /** md 24px (sidebar) · sm 20px (mobile sign-out pill). */
  size?: 'sm' | 'md'
}>(), { size: 'md' })
</script>

<template>
  <span
    class="avatar"
    :class="`avatar--${size}`"
    aria-hidden="true"
  >{{ initials }}</span>
</template>
