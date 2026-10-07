<script setup lang="ts">
import { journeyHistoryFixture } from '~/fixtures/journeys'
import type { FeedDay, JournalFilters } from '~/types/journal'
import {
  filtersFromQuery, filtersToQuery, filterSummary, isFiltering, journalBlocks, journalEyebrow, NO_FILTERS, onThisDay, onThisDayDates,
} from '~/utils/analytics/journal'
import { dayKey, formatTime } from '~/utils/date'

useHead({ title: 'Journal' })

const route = useRoute()
const router = useRouter()
const timeZone = useTimezone()
const now = useNow()
const activeJourneys = useActiveJourneys()
const { fetchFeed, fetchMonths, fetchTags, addLongEntry } = useJournal()
const { fetchRange } = useMoodHistory()

const today = computed(() => dayKey(now.value, timeZone.value))

// ── Filters (kept in the URL so back/forward and reloads work) ────────
const filters = computed(() => filtersFromQuery(route.query))
const filtersKey = computed(() => JSON.stringify(filtersToQuery(filters.value)))
const filtering = computed(() => isFiltering(filters.value))

function setFilters(patch: Partial<JournalFilters>) {
  router.replace({ query: { ...route.query, ...filtersToQuery({ ...filters.value, ...patch }) } })
}

// Typing updates the field at once and the URL (and so the feed) after a pause.
const search = ref(filters.value.query)
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(searchTimer)
  if (value.trim() === filters.value.query.trim()) return
  searchTimer = setTimeout(() => setFilters({ query: value }), value ? 300 : 0)
})
watch(() => filters.value.query, (query) => {
  if (query.trim() !== search.value.trim()) search.value = query
})
onBeforeUnmount(() => clearTimeout(searchTimer))

// ── Data ──────────────────────────────────────────────────────────────
const [{ data: feed, error: feedError, refresh: refreshFeed }, { data: overview }] = await Promise.all([
  useAsyncData('journal-feed', () => fetchFeed(filters.value, timeZone.value), { watch: [filtersKey] }),
  useAsyncData('journal-overview', async () => {
    const dates = onThisDayDates(today.value)
    const [months, tags, past] = await Promise.all([
      fetchMonths(timeZone.value),
      fetchTags(),
      Promise.all(dates.map(day => fetchRange(day, day, timeZone.value))),
    ])
    return { months, tags, memories: onThisDay(past.flat(), dates, timeZone.value) }
  }),
])

// Pages loaded with "Show earlier days"; dropped whenever the first page reloads.
const older = shallowRef<FeedDay[]>([])
const olderHasMore = ref<boolean | null>(null)
const loadingMore = ref(false)
const moreError = ref('')
watch(feed, () => {
  older.value = []
  olderHasMore.value = null
  moreError.value = ''
})

const days = computed(() => [...(feed.value?.days ?? []), ...older.value])
const hasMore = computed(() => olderHasMore.value ?? feed.value?.hasMore ?? false)

async function showEarlier() {
  const last = days.value.at(-1)
  if (!last || loadingMore.value) return
  const key = filtersKey.value
  loadingMore.value = true
  moreError.value = ''
  try {
    const page = await fetchFeed(filters.value, timeZone.value, last.day)
    if (key !== filtersKey.value) return
    older.value = [...older.value, ...page.days]
    olderHasMore.value = page.hasMore
  }
  catch {
    moreError.value = 'Couldn’t load earlier days. Try again.'
  }
  finally {
    loadingMore.value = false
  }
}

// Phase 6: real journeys replace this fixture.
const journeys = computed(() => journeyHistoryFixture(today.value))

const blocks = computed(() => journalBlocks(days.value, {
  filters: filters.value,
  today: today.value,
  months: overview.value?.months ?? [],
  journeys: journeys.value,
}))

const emptyText = computed(() => {
  if (feedError.value) return 'Couldn’t load your journal. Reload the page to try again.'
  if (filtering.value) return 'Nothing matches. Try a different word or tag.'
  return 'Nothing here yet. Notes you add to check-ins land here, grouped by day.'
})

const memories = computed(() => (filtering.value ? [] : overview.value?.memories ?? []))

// ── Composer ──────────────────────────────────────────────────────────
const composing = ref(false)
const draft = ref('')
const saving = ref(false)
const saveError = ref('')
const composer = useTemplateRef<{ focus: () => void }>('composer')

const composerLabel = computed(() => {
  const journey = activeJourneys.value[0]
  return ['Today', formatTime(now.value, timeZone.value), journey && `${journey.name} day ${journey.day}`].filter(Boolean).join(' · ')
})

async function openComposer() {
  composing.value = true
  await nextTick()
  composer.value?.focus()
}

function closeComposer() {
  composing.value = false
  draft.value = ''
  saveError.value = ''
}

async function save() {
  if (!draft.value.trim()) return closeComposer()
  saving.value = true
  saveError.value = ''
  try {
    await addLongEntry(draft.value)
    closeComposer()
    // Show the new entry: clearing filters reloads the feed, otherwise reload it here.
    if (filtering.value) setFilters({ query: NO_FILTERS.query, tag: NO_FILTERS.tag, level: NO_FILTERS.level })
    else await refreshFeed()
  }
  catch {
    saveError.value = 'Couldn’t save this entry. Your text is still here, so try again.'
  }
  finally {
    saving.value = false
  }
}

// ── Keys ──────────────────────────────────────────────────────────────
const filterBar = useTemplateRef<{ focusSearch: () => void }>('filterBar')

useHotkeys({
  w: (event) => {
    event.preventDefault()
    openComposer()
  },
  escape: () => {
    const active = document.activeElement
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) active.blur()
  },
})

// ⌘K on Today opens /journal#search (PLAN.md Q5).
onMounted(() => {
  if (route.hash === '#search') filterBar.value?.focusSearch()
})
</script>

<template>
  <div class="page page--journal journal">
    <PageHeader
      :eyebrow="journalEyebrow(overview?.months ?? [])"
      title="Written as you went"
      description="Every note from a check-in lands here, grouped by day. Nothing to keep up with. It fills in on its own."
    >
      <template #actions>
        <BaseButton
          variant="primary"
          kbd="W"
          aria-keyshortcuts="W"
          @click="openComposer"
        >
          Write something longer
        </BaseButton>
      </template>
    </PageHeader>

    <JournalComposer
      v-if="composing"
      ref="composer"
      v-model="draft"
      :label="composerLabel"
      :saving="saving"
      :error="saveError"
      @save="save"
      @discard="closeComposer"
    />

    <JournalFilters
      ref="filterBar"
      v-model:search="search"
      :filters="filters"
      :tags="overview?.tags ?? []"
      @change="setFilters"
    />

    <OnThisDay
      v-if="memories.length"
      :memories="memories"
      :time-zone="timeZone"
    />

    <p
      v-if="filtering"
      class="journal__active-filters"
    >
      {{ filterSummary(filters) }}
      <button
        type="button"
        class="journal__clear-filters"
        @click="setFilters({ query: '', tag: null, level: null })"
      >
        Clear filters
      </button>
    </p>

    <JournalFeed
      :blocks="blocks"
      :time-zone="timeZone"
      :empty-text="emptyText"
      :has-more="hasMore"
      :loading-more="loadingMore"
      :error="moreError"
      @more="showEarlier"
      @tag="setFilters({ tag: $event })"
    />
  </div>
</template>
