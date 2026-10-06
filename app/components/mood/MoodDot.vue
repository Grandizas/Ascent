<script setup lang="ts">
import { getMood, type MoodLevel } from '~/utils/mood'

const props = withDefaults(defineProps<{
  /** Mood level; ignored when `color` is given. */
  level?: MoodLevel
  color?: string
  /** Diameter in px (5–10 in the design). */
  size?: number
  glow?: boolean
}>(), { size: 7 })

const style = computed(() => ({
  '--dot-color': props.color ?? (props.level ? getMood(props.level).color : 'currentColor'),
  '--dot-size': `${props.size}px`,
}))
</script>

<template>
  <span
    class="mood-dot"
    :class="{ 'mood-dot--glow': glow }"
    :style="style"
    aria-hidden="true"
  />
</template>
