<script setup lang="ts">
import { isEmail } from '~/utils/password'

definePageMeta({ layout: 'auth', middleware: 'guest' })
useHead({ title: 'Reset password' })

const { requestPasswordReset } = useAuth()

const email = ref('')
const tried = ref(false)
const loading = ref(false)
const sent = ref(false)
const authError = ref<string | null>(null)

const emailError = computed(() => (tried.value && !isEmail(email.value) ? 'That doesn’t look like an email address.' : null))

async function submit() {
  tried.value = true
  if (emailError.value) return
  loading.value = true
  const { error } = await requestPasswordReset(email.value)
  loading.value = false
  if (error) authError.value = error
  else sent.value = true
}
</script>

<template>
  <div class="auth-page auth-page--compact">
    <AuthIntro
      v-if="sent"
      eyebrow="Reset password"
      title="Check your inbox."
      :description="`If there's an account for ${email.trim() || 'that address'}, a reset link is on its way. It expires in 30 minutes.`"
    />
    <template v-else>
      <AuthIntro
        eyebrow="Reset password"
        title="It happens."
        description="Enter your email and we’ll send a link to set a new password."
      />
      <form
        class="auth-form auth-form--tight"
        novalidate
        @submit.prevent="submit"
      >
        <TextField
          v-model="email"
          label="Email"
          hide-label
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          :error="emailError"
        />
        <p
          v-if="authError"
          class="auth-form__error"
          role="alert"
        >
          {{ authError }}
        </p>
        <BaseButton
          type="submit"
          variant="primary"
          size="3xl"
          block
          :loading="loading"
        >
          Send reset link
        </BaseButton>
      </form>
    </template>

    <NuxtLink
      to="/login"
      class="auth-back"
    >
      ← Back to log in
    </NuxtLink>
  </div>
</template>
