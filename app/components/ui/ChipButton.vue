<script setup lang="ts">
defineProps<{ selected?: boolean }>()
</script>

<template>
  <button
    type="button"
    class="chip"
    :class="{ 'is-selected': selected }"
    :aria-pressed="selected"
  >
    <slot />
  </button>
</template>
