<script setup lang="ts">
// Not in the design (PLAN.md Q6, phase 10): extrapolated in the app's style.
useHead({ title: 'Settings' })
</script>

<template>
  <div class="page page--settings settings">
    <PageHeader
      eyebrow="Settings"
      title="Your account"
      description="Your profile, the tags you log with, how you sign in, and your data."
    />
    <ProfileSettings />
    <TagSettings />
    <AccountSettings />
    <DataSettings />
  </div>
</template>
