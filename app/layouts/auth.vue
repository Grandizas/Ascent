<script setup lang="ts">
// Pages choose the top-right switch with `definePageMeta({ authSwitch: 'login' | 'signup' })`.
const route = useRoute()
const authSwitch = computed(() => route.meta.authSwitch as 'login' | 'signup' | undefined)
</script>

<template>
  <div class="auth">
    <AuthBrandPanel />
    <div class="auth__main">
      <div class="auth__top">
        <AppBrand class="auth__mobile-brand" />
        <span class="auth__spacer" />
        <p
          v-if="authSwitch === 'login'"
          class="auth__switch"
        >
          New here? <NuxtLink
            to="/signup"
            class="auth__switch-link"
          >Create an account</NuxtLink>
        </p>
        <p
          v-else-if="authSwitch === 'signup'"
          class="auth__switch"
        >
          Have an account? <NuxtLink
            to="/login"
            class="auth__switch-link"
          >Log in</NuxtLink>
        </p>
      </div>

      <main class="auth__center">
        <div class="auth__column">
          <slot />
        </div>
      </main>

      <footer class="auth__footer">
        <span>Not a medical service. If you're in crisis, contact local emergency services.</span>
        <!-- Privacy and Terms pages don't exist yet; shown as text until they do. -->
        <span class="auth__legal">
          <span>Privacy</span>
          <span>Terms</span>
        </span>
      </footer>
    </div>
  </div>
</template>
