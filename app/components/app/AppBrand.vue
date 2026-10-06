<script setup lang="ts">
const { appName } = useAppConfig()
</script>

<template>
  <NuxtLink
    to="/"
    class="brand"
  >
    <!-- A dot resting on a baseline. -->
    <span
      class="brand__mark"
      aria-hidden="true"
    />
    <span class="brand__name">{{ appName }}</span>
  </NuxtLink>
</template>
