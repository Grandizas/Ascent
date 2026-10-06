<script setup lang="ts">
defineProps<{
  text: string
  /** Where the observation comes from, and its caveat. */
  caption?: string
}>()
</script>

<template>
  <div class="observation">
    <Diamond class="observation__marker" />
    <div class="observation__text">
      <p class="observation__body">
        {{ text }}
      </p>
      <span
        v-if="caption"
        class="observation__caption"
      >{{ caption }}</span>
    </div>
  </div>
</template>
