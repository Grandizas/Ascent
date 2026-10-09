<script setup lang="ts">
const props = defineProps<{
  /** Accessible name, e.g. "Include Day 7". */
  label: string
  /** Shown checked and can't be changed (e.g. "Always included"). */
  locked?: boolean
  /** Tooltip. */
  title?: string
}>()

const checked = defineModel<boolean>({ required: true })

function toggle() {
  if (!props.locked) checked.value = !checked.value
}
</script>

<template>
  <button
    type="button"
    role="checkbox"
    class="check-square"
    :class="{ 'is-checked': checked, 'is-locked': locked }"
    :aria-checked="checked"
    :aria-disabled="locked || undefined"
    :aria-label="label"
    :title="title"
    @click="toggle"
  >
    <AppIcon
      v-if="checked"
      name="check"
    />
  </button>
</template>
