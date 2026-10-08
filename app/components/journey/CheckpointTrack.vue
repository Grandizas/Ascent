<script setup lang="ts">
import type { CheckpointTrack } from '~/utils/journey'

const props = defineProps<{ track: CheckpointTrack }>()

const percent = (share: number) => `${share * 100}%`

const description = computed(() => {
  const reached = props.track.floors.filter(f => f.state === 'reached').map(f => f.label)
  const next = props.track.floors.find(f => f.state === 'next')
  return [`Floors reached: ${reached.join(', ')}.`, next && `Next: ${next.label}.`].filter(Boolean).join(' ')
})
</script>

<template>
  <div
    class="checkpoint-track"
    role="img"
    :aria-label="description"
  >
    <span class="checkpoint-track__rail" />
    <span
      class="checkpoint-track__fill"
      :style="{ width: percent(track.progress) }"
    />
    <span
      v-for="floor in track.floors"
      :key="floor.day"
      class="checkpoint-track__floor"
      :class="`is-${floor.state}`"
      :style="{ left: percent(floor.x) }"
    >
      <span class="checkpoint-track__dot" />
      <span class="checkpoint-track__label">{{ floor.label }}</span>
    </span>
  </div>
</template>
