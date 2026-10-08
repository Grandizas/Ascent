<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  /** Earlier levels, each a link. */
  trail: readonly { label: string, to: RouteLocationRaw }[]
  /** The page itself. */
  current: string
}>()
</script>

<template>
  <nav
    class="breadcrumb"
    aria-label="Breadcrumb"
  >
    <template
      v-for="item in trail"
      :key="item.label"
    >
      <NuxtLink
        :to="item.to"
        class="breadcrumb__link"
      >
        {{ item.label }}
      </NuxtLink>
      <span
        class="breadcrumb__separator"
        aria-hidden="true"
      >/</span>
    </template>
    <span
      class="breadcrumb__current"
      aria-current="page"
    >{{ current }}</span>
  </nav>
</template>
