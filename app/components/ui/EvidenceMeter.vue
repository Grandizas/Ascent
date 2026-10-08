<script setup lang="ts">
import type { EvidenceLevel } from '~/utils/analytics/insights'

defineProps<{
  /** 1 early signal · 2 some evidence · 3 strong evidence. */
  level: EvidenceLevel
}>()
</script>

<template>
  <span
    class="evidence-meter"
    aria-hidden="true"
  >
    <span
      v-for="bar in 3"
      :key="bar"
      class="evidence-meter__bar"
      :class="{ 'is-on': bar <= level }"
    />
  </span>
</template>
