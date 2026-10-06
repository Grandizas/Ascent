<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { icons, type IconName } from '~/utils/icons'

const props = defineProps<{
  name: IconName
  /** Accessible label. Omit for decorative icons (hidden from screen readers). */
  label?: string
}>()
</script>

<template>
  <!-- FA 7 ignores `title`; an accessible name must come from aria-label. -->
  <FontAwesomeIcon
    :icon="icons[props.name]"
    :aria-label="props.label"
    :aria-hidden="props.label ? undefined : 'true'"
    class="app-icon"
  />
</template>
