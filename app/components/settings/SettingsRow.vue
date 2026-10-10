<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  /** Turns the title into a <label> for this control id. */
  labelFor?: string
  /** One-line confirmation shown under the row ("Saved."). */
  status?: string | null
  error?: string | null
}>()
</script>

<template>
  <div class="settings-row">
    <div class="settings-row__main">
      <div class="settings-row__text">
        <component
          :is="labelFor ? 'label' : 'span'"
          :for="labelFor"
          class="settings-row__title"
        >
          {{ title }}
        </component>
        <span
          v-if="description || $slots.description"
          class="settings-row__description"
        >
          <slot name="description">{{ description }}</slot>
        </span>
      </div>
      <div
        v-if="$slots.default"
        class="settings-row__control"
      >
        <slot />
      </div>
    </div>
    <slot name="details" />
    <p
      v-if="error"
      class="settings-row__error"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-else-if="status"
      class="settings-row__status"
      role="status"
    >
      {{ status }}
    </p>
  </div>
</template>
