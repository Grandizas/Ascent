<script setup lang="ts">
defineProps<{ options: readonly string[] }>()

const selected = defineModel<string[]>({ required: true })

function toggle(tag: string) {
  selected.value = selected.value.includes(tag)
    ? selected.value.filter(t => t !== tag)
    : [...selected.value, tag]
}
</script>

<template>
  <div
    class="tag-picker"
    role="group"
    aria-label="Context"
  >
    <ChipButton
      v-for="tag in options"
      :key="tag"
      :selected="selected.includes(tag)"
      @click="toggle(tag)"
    >
      {{ tag }}
    </ChipButton>
  </div>
</template>
