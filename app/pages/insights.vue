<script setup lang="ts">
import { type InsightsModel, insightsModel, type InsightsRange, isInsightsRange, journeyComparison, rangeStart } from '~/utils/analytics/insights'
import { dayKey } from '~/utils/date'
import { journeySpans } from '~/utils/journey'

useHead({ title: 'Insights' })

const route = useRoute()
const router = useRouter()
const now = useNow()
const timeZone = useTimezone()
const { fetchRange } = useMoodHistory()
const { journeys, fetchAttemptMoods } = useJourneys()

// The range lives in the URL (?range=30|90|365|all); 90 days by default, as designed.
const range = computed<InsightsRange>({
  get: () => {
    const value = String(route.query.range ?? '90')
    if (!isInsightsRange(value)) return 90
    return value === 'all' ? 'all' : Number(value) as InsightsRange
  },
  set: value => router.replace({ query: { ...route.query, range: value === 90 ? undefined : String(value) } }),
})

const today = computed(() => dayKey(now.value, timeZone.value))

const EMPTY: InsightsModel = { entries: 0, average: null, hours: [], weekdays: [null, null, null, null, null, null, null], tags: [], notices: [] }

// Only the computed model reaches the page (not every check-in in range).
const [{ data: model }, { data: moods }] = await Promise.all([
  useAsyncData('insights', async () => {
    const entries = await fetchRange(rangeStart(range.value, today.value) ?? '1970-01-01', today.value, timeZone.value)
    return insightsModel(entries, timeZone.value)
  }, { watch: [range] }),
  useAsyncData('journey-moods', fetchAttemptMoods),
])

const comparison = computed(() => journeyComparison(
  journeySpans(journeys.value, now.value, timeZone.value),
  new Map((moods.value ?? []).map(m => [m.attemptId, m])),
))
</script>

<template>
  <InsightsView
    v-model:range="range"
    :model="model ?? EMPTY"
    :journeys="comparison"
    :time-zone="timeZone"
  />
</template>
