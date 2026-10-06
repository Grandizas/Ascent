<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow?: string
  title: string
  description?: string
  /** serif — Inria Serif title (most pages) · sans — Geist display title (Today). */
  variant?: 'serif' | 'sans'
}>(), { variant: 'serif' })
</script>

<template>
  <header
    class="page-header"
    :class="`page-header--${variant}`"
  >
    <div class="page-header__text">
      <span
        v-if="eyebrow"
        class="page-header__eyebrow"
      >{{ eyebrow }}</span>
      <h1 class="page-header__title">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="page-header__description"
      >
        {{ description }}
      </p>
    </div>
    <div
      v-if="$slots.actions"
      class="page-header__actions"
    >
      <slot name="actions" />
    </div>
  </header>
</template>
