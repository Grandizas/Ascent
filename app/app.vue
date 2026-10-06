<script setup lang="ts">
const { appName } = useAppConfig()

useHead({
  titleTemplate: title => (title ? `${title} · ${appName}` : appName),
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
