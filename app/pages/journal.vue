<script setup lang="ts">
useHead({ title: 'Journal' })
</script>

<template>
  <div class="page page--journal">
    <PageHeader
      eyebrow="Journal"
      title="Written as you went"
      description="Every note from a check-in lands here, grouped by day. Nothing to keep up with. It fills in on its own."
    >
      <template #actions>
        <BaseButton
          variant="primary"
          kbd="W"
        >
          Write something longer
        </BaseButton>
      </template>
    </PageHeader>
    <p class="page-placeholder">
      Arrives in phase 5.
    </p>
  </div>
</template>
