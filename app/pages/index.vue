<script setup lang="ts">
import { todayObservationFixture } from '~/fixtures/insights'
import type { ChartLane } from '~/types/chart'
import type { MoodEntry } from '~/types/mood'
import { summarizeScores } from '~/utils/analytics/stats'
import { addDays, dayKey, minuteOfDay } from '~/utils/date'
import { DEFAULT_TAGS, type MoodLevel } from '~/utils/mood'

useHead({ title: 'Today' })

const timeZone = useTimezone()
const now = useNow()
const { firstName } = useProfile()
const { entries, loadRecent, syncError, clearSyncError } = useMoodEntries()
const { current, pulseKey, log, update, undo, done } = useMoodLog()

// Today, yesterday and the 30-day average all come from the last 31 days.
await useAsyncData('mood-entries:recent', async () => {
  await loadRecent(timeZone.value, 31)
  return true
})

// Phase 6: comes from the active journey's tracked tag instead of a constant.
const cravingsLane: ChartLane = { tag: 'Nicotine craving', label: 'Cravings', itemLabel: 'Craving' }

const today = computed(() => dayKey(now.value, timeZone.value))
const byLoggedAt = (a: MoodEntry, b: MoodEntry) => a.loggedAt.localeCompare(b.loggedAt)
const onDay = (key: string) => entries.value.filter(e => dayKey(e.loggedAt, timeZone.value) === key).sort(byLoggedAt)

const todayEntries = computed(() => onDay(today.value))
const yesterdayEntries = computed(() => onDay(addDays(today.value, -1)))
const recent = computed(() => [...todayEntries.value].reverse().slice(0, 5))
const lastEntry = computed(() => [...entries.value].sort(byLoggedAt).at(-1) ?? null)
const monthAverage = computed(() => {
  const from = addDays(today.value, -29)
  return summarizeScores(entries.value.filter(e => dayKey(e.loggedAt, timeZone.value) >= from).map(e => e.score)).average
})

// ── Logging ────────────────────────────────────────────────────────────
const card = useTemplateRef<{ focusNote: () => void }>('card')

async function pick(level: MoodLevel) {
  now.value = Date.now()
  await log(level)
}

async function focusNote(event: KeyboardEvent) {
  event.preventDefault() // don't type the "n" into the note
  if (!current.value) await pick(3)
  await nextTick()
  card.value?.focusNote()
}

function finish() {
  (document.activeElement as HTMLElement | null)?.blur()
  done()
}

useHotkeys({
  ...Object.fromEntries(([1, 2, 3, 4, 5] as const).map(level => [String(level), () => pick(level)])),
  'n': focusNote,
  'escape': () => current.value && finish(),
  'mod+k': (event) => {
    event.preventDefault()
    navigateTo('/journal')
  },
})
</script>

<template>
  <div class="page page--today today">
    <TodayHeader
      :now="now"
      :time-zone="timeZone"
      :first-name="firstName"
      :last-entry="lastEntry"
    />

    <div class="today__body">
      <MoodLogCard
        ref="card"
        :current="current"
        :pulse-key="pulseKey"
        :time-zone="timeZone"
        :tag-options="DEFAULT_TAGS"
        :error="syncError"
        @dismiss-error="clearSyncError"
        @pick="pick"
        @update="update"
        @undo="undo"
        @done="finish"
      />

      <TodayMood
        :entries="todayEntries"
        :yesterday="yesterdayEntries"
        :month-average="monthAverage"
        :time-zone="timeZone"
        :now-minute="minuteOfDay(now, timeZone)"
        :fresh-id="current?.id"
        :pulse-key="pulseKey"
        :lane="cravingsLane"
        :observation="todayObservationFixture"
      />

      <RecentMoments
        :entries="recent"
        :time-zone="timeZone"
      />
    </div>
  </div>
</template>
