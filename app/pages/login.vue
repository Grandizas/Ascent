<script setup lang="ts">
// Placeholder target for "Sign out" until the auth pages land in phase 3.
definePageMeta({ layout: false })
useHead({ title: 'Log in' })
</script>

<template>
  <div class="page page--wizard page-auth-placeholder">
    <AppBrand />
    <PageHeader
      eyebrow="Log in"
      title="Welcome back."
    />
    <p class="page-placeholder">
      Authentication arrives in phase 3. <NuxtLink to="/">
        Back to Today
      </NuxtLink>
    </p>
  </div>
</template>

<style lang="scss" scoped>
// Temporary page; removed in phase 3.
.page-auth-placeholder {
  padding: $main-padding;
}
</style>
