<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  autocomplete: 'current-password' | 'new-password'
  placeholder?: string
  error?: string | null
}>(), { label: 'Password' })

const model = defineModel<string>({ required: true })
const visible = ref(false)
</script>

<template>
  <TextField
    v-model="model"
    class="field--password"
    :label="label"
    :type="visible ? 'text' : 'password'"
    :autocomplete="autocomplete"
    :placeholder="placeholder"
    :error="error"
  >
    <template
      v-if="$slots['label-aside']"
      #label-aside
    >
      <slot name="label-aside" />
    </template>
    <template #control-end>
      <button
        type="button"
        class="field__toggle"
        :aria-pressed="visible"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        @click="visible = !visible"
      >
        {{ visible ? 'Hide' : 'Show' }}
      </button>
    </template>
    <slot />
  </TextField>
</template>
