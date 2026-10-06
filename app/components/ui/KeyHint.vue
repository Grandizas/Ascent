<script setup lang="ts">
withDefaults(defineProps<{
  /**
   * plain — bare mono letter (sidebar)
   * boxed — letter in a hairline box (search button, "Press 1–5")
   * inline — dimmed letter inside a button ("Done ESC")
   */
  variant?: 'plain' | 'boxed' | 'inline'
}>(), { variant: 'plain' })
</script>

<template>
  <kbd
    class="key-hint"
    :class="`key-hint--${variant}`"
  ><slot /></kbd>
</template>
