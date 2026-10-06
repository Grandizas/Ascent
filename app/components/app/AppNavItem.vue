<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  /** Link target; without it the item is a button (e.g. Sign out). */
  to?: RouteLocationRaw
  label: string
  shortcut?: string
  active?: boolean
  /** Dimmer, smaller row (Sign out). */
  muted?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="props.to ? NuxtLink : 'button'"
    :to="props.to"
    :type="props.to ? undefined : 'button'"
    class="nav-item"
    :class="{ 'is-active': active, 'nav-item--muted': muted }"
    :aria-current="active ? 'page' : undefined"
    @click="emit('click')"
  >
    {{ label }}
    <KeyHint
      v-if="shortcut"
      class="nav-item__key"
    >
      {{ shortcut }}
    </KeyHint>
  </component>
</template>
