<script setup lang="ts">
import { journeySummary } from '~/utils/journey'

const route = useRoute()
const now = useNow()
const { journeys } = useJourneys()

const found = computed(() => journeys.value.find(j => j.id === route.params.id))
if (!found.value) {
  throw createError({ statusCode: 404, statusMessage: 'Journey not found' })
}
const journey = computed(() => (found.value ? journeySummary(found.value, now.value) : null))

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
