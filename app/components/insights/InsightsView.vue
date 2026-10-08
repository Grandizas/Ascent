<script setup lang="ts">
import { INSIGHTS_RANGES, type InsightsModel, type InsightsRange, type JourneyComparisonRow } from '~/utils/analytics/insights'

const props = defineProps<{
  model: InsightsModel
  journeys: readonly JourneyComparisonRow[]
  timeZone: string
}>()

const range = defineModel<InsightsRange>('range', { required: true })

// The tag looked at closer; the first (most above average) until one is picked.
const picked = ref<string | null>(null)
const selected = computed({
  get: () => (props.model.tags.some(t => t.tag === picked.value) ? picked.value : props.model.tags[0]?.tag ?? null),
  set: (tag) => {
    picked.value = tag
  },
})
const selectedTag = computed(() => props.model.tags.find(t => t.tag === selected.value) ?? null)

const average = computed(() => (props.model.average === null ? '—' : props.model.average.toFixed(1)))
</script>

<template>
  <div class="page page--insights insights">
    <PageHeader
      :eyebrow="`Insights · ${model.entries.toLocaleString('en-GB')} check-ins in range`"
      title="What your entries suggest"
      description="Patterns that are hard to see one day at a time. Each one shows how much evidence it rests on."
    >
      <template #actions>
        <SegmentedControl
          v-model="range"
          :options="INSIGHTS_RANGES"
          label="Range"
        />
      </template>
    </PageHeader>

    <NoticeList :notices="model.notices" />

    <section class="insights__section">
      <SectionHeader
        label="Time of day"
        title="Your average day"
        description="Mood by hour, across every day in this range. The band covers the middle half of entries."
      />
      <HourChart
        class="insights__hours"
        :hours="model.hours"
        :average="model.average"
      />
      <WeekdayBars :averages="model.weekdays" />
    </section>

    <section class="insights__section">
      <SectionHeader
        label="Context"
        title="What tends to come with your moods"
        :description="`How entries with each tag compare with your average of ${average}. Select one to look closer.`"
      />
      <TagContextTable
        v-model="selected"
        class="insights__table"
        :tags="model.tags"
      />
      <TagDetailCard
        v-if="selectedTag"
        :tag="selectedTag"
        :time-zone="timeZone"
      />
    </section>

    <section class="insights__section">
      <SectionHeader
        label="Journeys"
        title="Before and during each change"
        description="Average mood in the 30 days before a journey began, against the time it ran. Other things were happening too."
      />
      <JourneyComparison
        class="insights__table"
        :rows="journeys"
      />
    </section>

    <p class="insights__footnote">
      These are associations within your own entries. They can point at something worth testing, often as a journey, but they don't prove that one thing caused another.
    </p>
  </div>
</template>
