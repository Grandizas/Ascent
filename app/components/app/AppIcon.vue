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
  <FontAwesomeIcon
    :icon="icons[props.name]"
    :title="props.label"
    :aria-hidden="props.label ? undefined : 'true'"
    class="app-icon"
  />
</template>
