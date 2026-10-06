<script setup lang="ts">
useHead({ title: 'New journey' })

useHotkeys({ escape: () => navigateTo('/journeys') })
</script>

<template>
  <div class="page page--wizard">
    <PageHeader
      eyebrow="Step 1 of 4"
      title="New journey"
    />
    <p class="page-placeholder">
      Arrives in phase 6.
    </p>
  </div>
</template>
