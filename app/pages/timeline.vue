<script setup lang="ts">
import { periodFor, previousPeriod, TIMELINE_RANGES, type TimelineRange } from '~/utils/analytics/timeline'
import { dayKey } from '~/utils/date'
import { journeySpans } from '~/utils/journey'

useHead({ title: 'Timeline' })

const route = useRoute()
const router = useRouter()
const timeZone = useTimezone()
const now = useNow()
const { fetchRange, fetchOverview } = useMoodHistory()
const { journeys: allJourneys } = useJourneys()

// ── Period (kept in the URL so back/forward and reloads work) ─────────
const isRange = (value: unknown): value is TimelineRange => TIMELINE_RANGES.some(r => r.value === value)
const range = computed<TimelineRange>(() => (isRange(route.query.range) ? route.query.range : 'month'))
const offset = computed(() => Math.max(0, Number.parseInt(String(route.query.offset ?? '0'), 10) || 0))

function navigate(nextRange: TimelineRange, nextOffset: number) {
  router.replace({ query: { ...route.query, range: nextRange, offset: nextOffset || undefined } })
}

const today = computed(() => dayKey(now.value, timeZone.value))

const { data: overview } = await useAsyncData('mood-overview', fetchOverview)
const firstDay = computed(() => (overview.value?.firstLoggedAt ? dayKey(overview.value.firstLoggedAt, timeZone.value) : today.value))

const period = computed(() => periodFor(range.value, offset.value, today.value, firstDay.value))
const previous = computed(() => previousPeriod(period.value, today.value))

// ── Data: the period plus the one before it (for "vs previous") ───────
const { data } = await useAsyncData(
  () => `timeline:${period.value.start}:${period.value.end}`,
  async () => {
    const all = await fetchRange(previous.value?.start ?? period.value.start, period.value.end, timeZone.value)
    const inPeriod = (loggedAt: string) => dayKey(loggedAt, timeZone.value) >= period.value.start
    return { entries: all.filter(e => inPeriod(e.loggedAt)), previous: previous.value ? all.filter(e => !inPeriod(e.loggedAt)) : null }
  },
)

const journeys = computed(() => journeySpans(allJourneys.value, now.value, timeZone.value))

const view = useTemplateRef<{ older: () => void, newer: () => void }>('view')
useHotkeys({
  ...Object.fromEntries(TIMELINE_RANGES.map(r => [r.shortcut, () => navigate(r.value, 0)])),
  arrowleft: () => view.value?.older(),
  arrowright: () => view.value?.newer(),
})
</script>

<template>
  <TimelineView
    ref="view"
    :period="period"
    :today="today"
    :time-zone="timeZone"
    :entries="data?.entries ?? []"
    :previous="data?.previous ?? null"
    :total="overview?.total ?? 0"
    :first-day="firstDay"
    :journeys="journeys"
    @navigate="navigate"
  />
</template>
