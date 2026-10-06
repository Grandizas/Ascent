<script setup lang="ts">
import type { OAuthProvider } from '~/composables/useAuth'
import { isEmail, MIN_PASSWORD_LENGTH } from '~/utils/password'

definePageMeta({ layout: 'auth', middleware: 'guest', authSwitch: 'signup' })
useHead({ title: 'Create an account' })

const { signUp, signInWithProvider } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const tried = ref(false)
const loading = ref(false)
const authError = ref<string | null>(null)
/** Set when the project requires email confirmation before the first sign-in. */
const sentTo = ref<string | null>(null)

const emailError = computed(() => (tried.value && !isEmail(email.value) ? 'That doesn’t look like an email address.' : null))
const passwordError = computed(() =>
  tried.value && password.value.length < MIN_PASSWORD_LENGTH ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : null)

watch([email, password], () => (authError.value = null))

async function submit() {
  tried.value = true
  if (emailError.value || passwordError.value) return

  loading.value = true
  const { error, needsConfirmation } = await signUp({ name: name.value, email: email.value, password: password.value })
  loading.value = false
  if (error) {
    authError.value = error
    return
  }
  if (needsConfirmation) {
    sentTo.value = email.value.trim()
    return
  }
  await navigateTo('/welcome')
}

async function oauth(provider: OAuthProvider) {
  const { error } = await signInWithProvider(provider, '/welcome')
  if (error) authError.value = error
}
</script>

<template>
  <div
    v-if="sentTo"
    class="auth-page auth-page--compact"
  >
    <!-- Not in the design: confirmation-required projects need a "check your inbox" step. -->
    <AuthIntro
      eyebrow="Confirm your email"
      title="Check your inbox."
      :description="`We sent a link to ${sentTo}. Open it to finish creating your account.`"
    />
    <NuxtLink
      to="/login"
      class="auth-back"
    >
      ← Back to log in
    </NuxtLink>
  </div>

  <div
    v-else
    class="auth-page"
  >
    <AuthIntro
      eyebrow="Create account"
      title="Start with how you feel today."
      description="One account, one quiet place for your moods, notes and the things you’re changing."
    />

    <OAuthButtons
      :disabled="loading"
      @select="oauth"
    />

    <form
      class="auth-form"
      novalidate
      @submit.prevent="submit"
    >
      <TextField
        v-model="name"
        label="What should we call you?"
        autocomplete="given-name"
        placeholder="Alex"
      />
      <TextField
        v-model="email"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        :error="emailError"
      />
      <PasswordField
        v-model="password"
        autocomplete="new-password"
        placeholder="At least 8 characters"
        :error="passwordError"
      >
        <PasswordStrength :password="password" />
      </PasswordField>
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
        class="auth-form__submit"
        block
        :loading="loading"
      >
        {{ loading ? 'Creating account…' : 'Create account' }}
      </BaseButton>
    </form>

    <p class="auth-note">
      Your entries are private and encrypted. They’re never sold or shared, and never used to train models. You can export or delete everything at any time.
    </p>
  </div>
</template>
