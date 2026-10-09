<script setup lang="ts">
import { safeNext } from '~/composables/useAuth'

// Landing page for email-confirmation and OAuth links (Supabase redirect target).
definePageMeta({ layout: 'auth' })
useHead({ title: 'Signing you in' })

const route = useRoute()
const session = useSupabaseSession()
const failed = ref(Boolean(route.query.error || route.query.error_description))

const goNext = () => navigateTo(safeNext(route.query.next), { replace: true })
let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  if (failed.value) return
  // The Supabase client exchanges the link's code for a session on load;
  // usually that has already happened by the time this page mounts.
  if (session.value) {
    goNext()
    return
  }
  const stop = watch(session, (value) => {
    if (!value) return
    stop()
    failed.value = false // a slow callback can still succeed after the timeout
    goNext()
  })
  timer = setTimeout(() => {
    if (!session.value) failed.value = true
  }, 8000)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="auth-page auth-page--compact">
    <template v-if="failed">
      <AuthIntro
        eyebrow="Sign in"
        title="That link didn’t work."
        description="It may have expired or already been used. Log in again, or request a new link."
      />
      <NuxtLink
        to="/login"
        class="auth-back"
      >
        <AppIcon name="arrow-left" />
        Back to log in
      </NuxtLink>
    </template>
    <AuthIntro
      v-else
      eyebrow="Sign in"
      title="One moment."
      description="Signing you in…"
    />
  </div>
</template>
