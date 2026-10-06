<script setup lang="ts">
import { PASSWORD_LABELS, passwordScore } from '~/utils/password'

const props = defineProps<{ password: string }>()

const score = computed(() => passwordScore(props.password))
const label = computed(() => (props.password ? PASSWORD_LABELS[score.value] : ''))
</script>

<template>
  <div
    class="password-strength"
    :class="`password-strength--${score}`"
  >
    <span
      class="password-strength__bars"
      aria-hidden="true"
    >
      <span
        v-for="segment in 4"
        :key="segment"
        class="password-strength__bar"
        :class="{ 'is-filled': segment <= score }"
      />
    </span>
    <span
      class="password-strength__label"
      aria-live="polite"
    >{{ label }}</span>
  </div>
</template>
