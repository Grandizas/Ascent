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
   * danger — muted red hairline (Delete account; not in the design)
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'sage' | 'icon' | 'danger'
  /** Heights from the design: xs 28 · sm 30 · md 34 · lg 36 · xl 38 · 2xl 40 · 3xl 44 (auth). */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  /** Full width. */
  block?: boolean
  /** Dims the button and blocks clicks while an action runs. */
  loading?: boolean
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
    :class="[`btn--${props.variant}`, `btn--${props.size}`, { 'btn--block': props.block, 'is-loading': props.loading }]"
    :to="props.to"
    :type="props.to ? undefined : props.type"
    :disabled="props.to ? undefined : props.disabled || props.loading"
    :aria-busy="props.loading || undefined"
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
