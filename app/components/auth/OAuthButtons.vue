<script setup lang="ts">
import type { OAuthProvider } from '~/composables/useAuth'

defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ select: [provider: OAuthProvider] }>()

const PROVIDERS: { id: OAuthProvider, label: string }[] = [
  { id: 'google', label: 'Continue with Google' },
]
</script>

<template>
  <div class="oauth">
    <div class="oauth__buttons">
      <button
        v-for="provider in PROVIDERS"
        :key="provider.id"
        type="button"
        class="oauth__button"
        :disabled="disabled"
        @click="emit('select', provider.id)"
      >
        {{ provider.label }}
      </button>
    </div>
    <div
      class="oauth__divider"
      role="separator"
    >
      or with email
    </div>
  </div>
</template>
