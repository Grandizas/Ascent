<script setup lang="ts">
import { defaultReviewYear, reviewModel, reviewYears } from '~/utils/analytics/review'
import { dayKey } from '~/utils/date'
import { journeySpans } from '~/utils/journey'

const route = useRoute()
const now = useNow()
const timeZone = useTimezone()
const { fetchRange, fetchOverview } = useMoodHistory()
const { journeys } = useJourneys()

const today = computed(() => dayKey(now.value, timeZone.value))

const { data: overview } = await useAsyncData('mood-overview', fetchOverview)
const firstDay = computed(() => (overview.value?.firstLoggedAt ? dayKey(overview.value.firstLoggedAt, timeZone.value) : null))
const years = computed(() => reviewYears(firstDay.value, today.value))

// /review shows the last complete year with check-ins; /review/2025 a given one.
const requested = route.params.year ? Number(route.params.year) : null
if (requested !== null && !years.value.includes(requested)) {
  throw createError({ statusCode: 404, statusMessage: 'No year review for that year' })
}
const year = computed({
  get: () => requested ?? defaultReviewYear(firstDay.value, today.value),
  set: value => navigateTo(`/review/${value}`, { replace: true }),
})

useHead({ title: () => `Year review ${year.value}` })

// Only the computed model reaches the page, not the year's check-ins.
const { data: model } = await useAsyncData(`review:${year.value}`, async () => {
  const start = `${year.value}-01-01`
  const end = `${year.value}-12-31`
  const entries = await fetchRange(start, today.value < end ? today.value : end, timeZone.value)
  return reviewModel({
    year: year.value,
    entries,
    journeys: journeySpans(journeys.value, now.value, timeZone.value),
    firstDay: firstDay.value,
    today: today.value,
    timeZone: timeZone.value,
  })
})
</script>

<template>
  <ReviewView
    v-if="model"
    v-model:year="year"
    :model="model"
    :years="years"
    :today="today"
  />
</template>
