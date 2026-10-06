<script setup lang="ts">
useHead({ title: 'Insights' })

const range = ref(90)
const ranges = [
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '1 year' },
  { value: 0, label: 'All time' },
]
</script>

<template>
  <div class="page page--insights">
    <PageHeader
      eyebrow="Insights"
      title="What your entries suggest"
    >
      <template #actions>
        <SegmentedControl
          v-model="range"
          :options="ranges"
          label="Range"
        />
      </template>
    </PageHeader>
    <p class="page-placeholder">
      Arrives in phase 8.
    </p>
  </div>
</template>
