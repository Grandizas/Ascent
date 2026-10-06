<script setup lang="ts">
useHead({ title: 'Journeys' })

useHotkeys({ n: () => navigateTo('/journeys/new') })
</script>

<template>
  <div class="page page--journeys">
    <PageHeader
      eyebrow="Journeys"
      title="What you're changing"
      description="Each journey is an experiment on yourself. Change one thing on purpose, then watch what actually happens."
    >
      <template #actions>
        <BaseButton
          variant="primary"
          to="/journeys/new"
          kbd="N"
        >
          Start a journey
        </BaseButton>
      </template>
    </PageHeader>
    <p class="page-placeholder">
      Arrives in phase 6.
    </p>
  </div>
</template>
