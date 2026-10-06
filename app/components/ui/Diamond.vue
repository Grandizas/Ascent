<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** hollow — observation bullet · filled — journal event marker. */
  variant?: 'hollow' | 'filled'
  color?: string
  size?: number
}>(), { variant: 'hollow', size: 7 })

const style = computed(() => ({
  '--diamond-size': `${props.size}px`,
  ...(props.color ? { '--diamond-color': props.color } : {}),
}))
</script>

<template>
  <span
    class="diamond"
    :class="`diamond--${variant}`"
    :style="style"
    aria-hidden="true"
  />
</template>
