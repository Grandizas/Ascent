<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(defineProps<{
  /**
   * primary — light fill (main action)
   * secondary — quiet hairline (Undo, Discard)
   * outline — stronger hairline, brighter text (Record a setback)
   * ghost — text only (Edit rules)
   * sage — journey call to action (Begin at Floor I)
   * icon — square hairline (period arrows)
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'sage' | 'icon'
  /** Heights from the design: xs 28 · sm 30 · md 34 · lg 36 · xl 38 · 2xl 40. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Renders a NuxtLink instead of a button. */
  to?: RouteLocationRaw
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  /** Keyboard hint shown inside the button, e.g. "N" or "ESC". */
  kbd?: string
}>(), {
  variant: 'secondary',
  size: 'md',
  type: 'button',
})

const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="props.to ? NuxtLink : 'button'"
    class="btn"
    :class="[`btn--${props.variant}`, `btn--${props.size}`]"
    :to="props.to"
    :type="props.to ? undefined : props.type"
    :disabled="props.to ? undefined : props.disabled"
  >
    <slot />
    <KeyHint
      v-if="props.kbd"
      variant="inline"
    >
      {{ props.kbd }}
    </KeyHint>
  </component>
</template>
