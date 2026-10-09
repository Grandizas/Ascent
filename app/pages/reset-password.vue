<script setup lang="ts">
import { MIN_PASSWORD_LENGTH } from '~/utils/password'

// Not in the design: where the reset email lands. Extrapolated from the auth pages.
definePageMeta({ layout: 'auth' })
useHead({ title: 'Choose a new password' })

const route = useRoute()
const session = useSupabaseSession()
const { updatePassword } = useAuth()

const password = ref('')
const tried = ref(false)
const loading = ref(false)
const authError = ref<string | null>(null)
/** The link carried an error, or no session appeared in time. */
const invalid = ref(Boolean(route.query.error || route.query.error_description))

const passwordError = computed(() =>
  tried.value && password.value.length < MIN_PASSWORD_LENGTH ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : null)

// The Supabase client exchanges the link's code for a session on load.
onMounted(() => {
  if (invalid.value || session.value) return
  const timer = setTimeout(() => (invalid.value = !session.value), 6000)
  watch(session, value => value && clearTimeout(timer))
})

async function submit() {
  tried.value = true
  if (passwordError.value) return
  loading.value = true
  const { error } = await updatePassword(password.value)
  loading.value = false
  if (error) authError.value = error
  else await navigateTo('/')
}
</script>

<template>
  <div class="auth-page auth-page--compact">
    <template v-if="invalid">
      <AuthIntro
        eyebrow="Reset password"
        title="This link has expired."
        description="Reset links work once and expire after 30 minutes. Request a new one."
      />
      <BaseButton
        to="/forgot-password"
        variant="primary"
        size="3xl"
        block
      >
        Send a new link
      </BaseButton>
    </template>

    <template v-else-if="session">
      <AuthIntro
        eyebrow="Reset password"
        title="Choose a new password."
        description="Use at least 8 characters. You’ll stay logged in on this device."
      />
      <form
        class="auth-form auth-form--tight"
        novalidate
        @submit.prevent="submit"
      >
        <PasswordField
          v-model="password"
          label="New password"
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
          block
          :loading="loading"
        >
          Save new password
        </BaseButton>
      </form>
    </template>

    <AuthIntro
      v-else
      eyebrow="Reset password"
      title="One moment."
      description="Checking your reset link…"
    />

    <NuxtLink
      to="/login"
      class="auth-back"
    >
      <AppIcon name="arrow-left" />
      Back to log in
    </NuxtLink>
  </div>
</template>
