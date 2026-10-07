<script setup lang="ts">
defineProps<{
  /** "October 2026" (shown uppercase). */
  label: string
  /** "41 notes · avg 5.6"; hidden while filtering. */
  summary?: string
}>()
</script>

<template>
  <div class="journal-month">
    <h2 class="journal-month__label">
      {{ label }}
    </h2>
    <span
      v-if="summary"
      class="journal-month__summary"
    >{{ summary }}</span>
  </div>
</template>
