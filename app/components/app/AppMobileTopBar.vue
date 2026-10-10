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
      <!-- Settings holds Sign out on phones (PLAN.md §8 #32). -->
      <NuxtLink
        to="/settings"
        class="mobile-top-bar__account"
        :class="{ 'is-active': route.path === '/settings' }"
      >
        <AppAvatar
          :initials="initials"
          size="sm"
        />
        Settings
      </NuxtLink>
    </div>
  </div>
</template>
