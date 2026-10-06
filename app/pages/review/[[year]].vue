<script setup lang="ts">
const route = useRoute()
const year = computed(() => Number(route.params.year) || new Date().getFullYear())

useHead({ title: () => `Year review ${year.value}` })
</script>

<template>
  <div class="page page--review">
    <PageHeader
      eyebrow="Year in review"
      :title="String(year)"
    />
    <p class="page-placeholder">
      Arrives in phase 9.
    </p>
  </div>
</template>
