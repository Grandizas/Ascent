<script setup lang="ts">
import type { Climb } from '~/utils/analytics/journeyDetail'

defineProps<{ climb: Climb }>()

const percent = (share: number) => `${(share * 100).toFixed(1)}%`
// Older days fade out below today.
const tickAlpha = (distance: number) => Math.max(0.25, 0.75 - distance * 0.15)
</script>

<template>
  <ol
    class="journey-climb"
    aria-label="Floors"
  >
    <template
      v-for="step in climb.steps"
      :key="step.key"
    >
      <li
        class="journey-climb__floor"
        :class="`is-${step.kind}`"
        :style="{ opacity: step.opacity, filter: step.blur ? `blur(${step.blur}px)` : undefined }"
        :aria-current="step.kind === 'current' ? 'step' : undefined"
      >
        <span class="journey-climb__node">
          <span class="journey-climb__circle">{{ step.label }}</span>
        </span>
        <span class="journey-climb__note">
          <span
            class="journey-climb__line"
            aria-hidden="true"
          />
          {{ step.note }}
        </span>
      </li>

      <li
        v-if="step.tube && climb.tube"
        class="journey-climb__tube-row"
        aria-hidden="true"
      >
        <span class="journey-climb__node">
          <span class="journey-climb__tube">
            <span
              class="journey-climb__fill"
              :style="{ height: percent(climb.tube.progress) }"
            />
            <span
              v-for="tick in climb.tube.ticks"
              :key="tick.label"
              class="journey-climb__tick"
              :class="{ 'is-today': tick.distance === 0, 'is-yesterday': tick.distance === 1 }"
              :style="{ 'bottom': percent(tick.bottom), '--tick-alpha': tickAlpha(tick.distance) }"
            >
              {{ tick.label }}
              <span class="journey-climb__tick-line" />
            </span>
            <span
              class="journey-climb__here"
              :style="{ bottom: percent(climb.tube.progress) }"
            >
              <span class="journey-climb__here-line" />
              You are here
            </span>
          </span>
        </span>
      </li>

      <li
        v-if="step.pill"
        class="journey-climb__pill-row"
        :style="{ opacity: step.opacity }"
        aria-hidden="true"
      >
        <span class="journey-climb__node">
          <span class="journey-climb__pill" />
        </span>
      </li>
    </template>
  </ol>
</template>
