<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow: string
  title: string
  description?: string
  /** success — green eyebrow (account created). */
  tone?: 'default' | 'success'
}>(), { tone: 'default' })
</script>

<template>
  <header
    class="auth-intro"
    :class="`auth-intro--${tone}`"
  >
    <span class="auth-intro__eyebrow">{{ eyebrow }}</span>
    <h1 class="auth-intro__title">
      {{ title }}
    </h1>
    <p
      v-if="description"
      class="auth-intro__description"
    >
      {{ description }}
    </p>
  </header>
</template>
