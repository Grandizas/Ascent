<script setup lang="ts">
const route = useRoute()
const journeys = useActiveJourneys()

const journey = computed(() => journeys.value.find(j => j.id === route.params.id))
if (!journey.value) {
  throw createError({ statusCode: 404, statusMessage: 'Journey not found' })
}

useHead({ title: () => journey.value?.name ?? 'Journey' })
</script>

<template>
  <div
    v-if="journey"
    class="page page--journey"
  >
    <PageHeader
      :eyebrow="`Day ${journey.day}`"
      :title="journey.name"
    />
    <p class="page-placeholder">
      The climb arrives in phase 7.
    </p>
  </div>
</template>
