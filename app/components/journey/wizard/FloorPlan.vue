<script setup lang="ts">
import type { WizardFloor } from '~/utils/journeyWizard'

defineProps<{ floors: readonly WizardFloor[] }>()

const emit = defineEmits<{ toggle: [day: number] }>()
</script>

<template>
  <ol class="floor-plan">
    <li
      v-for="floor in floors"
      :key="floor.day"
      class="floor-plan__floor"
      :class="{ 'is-off': !floor.on, 'is-major': floor.fixed, 'is-summit': floor.roman === 'SUMMIT' }"
    >
      <span
        class="floor-plan__dot"
        aria-hidden="true"
      />
      <span class="floor-plan__name">
        <span class="floor-plan__title">{{ floor.title }}</span>
        <span class="floor-plan__roman">{{ floor.roman }}</span>
      </span>
      <span class="floor-plan__expectation">{{ floor.expectation }}</span>
      <CheckSquare
        :model-value="floor.on"
        :locked="floor.fixed"
        :label="`Include ${floor.title}`"
        :title="floor.fixed ? 'Always included' : floor.on ? 'Skip this floor' : 'Include this floor'"
        @update:model-value="emit('toggle', floor.day)"
      />
    </li>
  </ol>
</template>
