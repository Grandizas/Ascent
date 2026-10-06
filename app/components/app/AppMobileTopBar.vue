<script setup lang="ts">
const route = useRoute()
const { initials } = useProfile()
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
      <NuxtLink
        to="/login"
        class="mobile-top-bar__sign-out"
      >
        <AppAvatar
          :initials="initials"
          size="sm"
        />
        Sign out
      </NuxtLink>
    </div>
  </div>
</template>
