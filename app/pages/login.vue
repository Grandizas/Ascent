<script setup lang="ts">
import { safeNext, type OAuthProvider } from '~/composables/useAuth'
import { isEmail } from '~/utils/password'

definePageMeta({ layout: 'auth', middleware: 'guest', authSwitch: 'login' })
useHead({ title: 'Log in' })

const { signIn, signInWithProvider } = useAuth()
const redirect = useSupabaseCookieRedirect()

const email = ref('')
const password = ref('')
const tried = ref(false)
const loading = ref(false)
const authError = ref<string | null>(null)

// Errors appear only after the first submit attempt, as in the design.
const emailError = computed(() => (tried.value && !isEmail(email.value) ? 'That doesn’t look like an email address.' : null))
const passwordError = computed(() => (tried.value && !password.value ? 'Enter your password.' : null))

watch([email, password], () => (authError.value = null))

async function submit() {
  tried.value = true
  if (emailError.value || passwordError.value) return

  loading.value = true
  const { error } = await signIn(email.value, password.value)
  loading.value = false
  if (error) {
    authError.value = error
    return
  }
  await navigateTo(safeNext(redirect.pluck()))
}

async function oauth(provider: OAuthProvider) {
  const { error } = await signInWithProvider(provider, safeNext(redirect.pluck()))
  if (error) authError.value = error
}
</script>

<template>
  <div class="auth-page">
    <AuthIntro
      eyebrow="Log in"
      title="Welcome back."
      description="Pick up where you left off. Your timeline and journeys are waiting."
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
        v-model="email"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        :error="emailError"
      />
      <PasswordField
        v-model="password"
        autocomplete="current-password"
        :error="passwordError"
      >
        <template #label-aside>
          <NuxtLink
            to="/forgot-password"
            class="auth-link"
          >
            Forgot it?
          </NuxtLink>
        </template>
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
        {{ loading ? 'Logging in…' : 'Log in' }}
      </BaseButton>
    </form>
  </div>
</template>
