<script setup lang="ts">
const route = useRoute()
const { initials } = useProfile()
const { signOut } = useAuth()
</script>

<template>
  <div class="mobile-top-bar">
    <AppBrand />
    <div class="mobile-top-bar__actions">
      <NuxtLink
        to="/review"
        class="mobile-top-bar__link"
        :class="{ 'is-active': route.path.startsWith('/review') }"
      >
        Year review
      </NuxtLink>
      <button
        type="button"
        class="mobile-top-bar__sign-out"
        @click="signOut"
      >
        <AppAvatar
          :initials="initials"
          size="sm"
        />
        Sign out
      </button>
    </div>
  </div>
</template>
