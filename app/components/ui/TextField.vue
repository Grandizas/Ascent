<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  /** Hide the label visually (it stays available to screen readers). */
  hideLabel?: boolean
  type?: 'text' | 'email' | 'password'
  autocomplete?: string
  placeholder?: string
  /** Shown under the field; also marks it invalid. */
  error?: string | null
}>(), { type: 'text' })

const model = defineModel<string>({ required: true })
const id = useId()
</script>

<template>
  <div
    class="field"
    :class="{ 'is-invalid': !!error }"
  >
    <div class="field__label-row">
      <label
        :for="id"
        class="field__label"
        :class="{ 'visually-hidden': hideLabel }"
      >{{ label }}</label>
      <slot name="label-aside" />
    </div>
    <div class="field__control">
      <input
        :id="id"
        v-model="model"
        class="field__input"
        :type="type"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
      >
      <slot name="control-end" />
    </div>
    <span
      v-if="error"
      :id="`${id}-error`"
      class="field__error"
    >{{ error }}</span>
    <slot />
  </div>
</template>
