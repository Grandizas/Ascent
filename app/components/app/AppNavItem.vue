<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  to: RouteLocationRaw
  label: string
  shortcut?: string
  active?: boolean
  /** Dimmer, smaller row (Sign out). */
  muted?: boolean
}>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="nav-item"
    :class="{ 'is-active': active, 'nav-item--muted': muted }"
    :aria-current="active ? 'page' : undefined"
  >
    {{ label }}
    <KeyHint
      v-if="shortcut"
      class="nav-item__key"
    >
      {{ shortcut }}
    </KeyHint>
  </NuxtLink>
</template>
