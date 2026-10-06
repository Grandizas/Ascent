<script setup lang="ts">
import { MOODS, type MoodLevel } from '~/utils/mood'

withDefaults(defineProps<{
  /** Mood of the entry being logged, if any. */
  selected?: MoodLevel | null
  /** Changes on every pick so the selected tile pulses again. */
  pulseKey?: number
  /** large — Today (key, ticks, pulse) · compact — onboarding (dot + label). */
  variant?: 'large' | 'compact'
}>(), { variant: 'large' })

const emit = defineEmits<{ pick: [level: MoodLevel] }>()

// Ascending bars next to the shortcut number: filled up to the mood's level.
const TICKS = [1, 2, 3, 4, 5] as const
</script>

<template>
  <div
    class="mood-picker"
    :class="`mood-picker--${variant}`"
    role="group"
    aria-label="How do you feel right now?"
  >
    <button
      v-for="mood in MOODS"
      :key="mood.level"
      type="button"
      class="mood-picker__tile"
      :class="{ 'is-selected': selected === mood.level }"
      :style="{ '--mood': mood.color }"
      :aria-pressed="selected === mood.level"
      :aria-keyshortcuts="String(mood.level)"
      @click="emit('pick', mood.level)"
    >
      <span
        v-if="variant === 'large' && selected === mood.level"
        :key="pulseKey"
        class="mood-picker__pulse"
        aria-hidden="true"
      />
      <span
        v-if="variant === 'large'"
        class="mood-picker__top"
      >
        <span class="mood-picker__key">{{ mood.level }}</span>
        <span
          class="mood-picker__ticks"
          aria-hidden="true"
        >
          <span
            v-for="tick in TICKS"
            :key="tick"
            class="mood-picker__tick"
            :class="{ 'is-filled': tick <= mood.level }"
          />
        </span>
      </span>
      <span class="mood-picker__bottom">
        <MoodDot
          :color="mood.color"
          :size="8"
        />
        <span class="mood-picker__label">{{ mood.label }}</span>
      </span>
    </button>
  </div>
</template>
