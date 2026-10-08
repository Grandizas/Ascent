<script setup lang="ts">
import { attemptBars, climbingRows, pastRows } from '~/utils/journey'

useHead({ title: 'Journeys' })

const now = useNow()
const timeZone = useTimezone()
const { journeys, loadFailed, fetchAttemptMoods } = useJourneys()

const { data: moodList } = await useAsyncData('journey-moods', fetchAttemptMoods)
const moods = computed(() => new Map((moodList.value ?? []).map(m => [m.attemptId, m])))

const climbing = computed(() => climbingRows(journeys.value, moods.value, now.value, timeZone.value))
const past = computed(() => pastRows(journeys.value, moods.value, now.value, timeZone.value))
// Journeys being climbed again get their attempts compared.
const retried = computed(() => climbing.value
  .filter(row => row.journey.attempts.length > 1)
  .map(row => ({ journey: row.journey, bars: attemptBars(row.journey, now.value, timeZone.value) })))

const eyebrow = computed(() => `Journeys · ${climbing.value.length} active · ${past.value.length} behind you`)

useHotkeys({ n: () => navigateTo('/journeys/new') })
</script>

<template>
  <div class="page page--journeys journeys">
    <PageHeader
      :eyebrow="eyebrow"
      title="What you're changing"
      description="Each journey is an experiment on yourself. Change one thing on purpose, then watch what actually happens."
    >
      <template #actions>
        <BaseButton
          variant="primary"
          to="/journeys/new"
          kbd="N"
          aria-keyshortcuts="N"
        >
          Start a journey
        </BaseButton>
      </template>
    </PageHeader>

    <section
      class="journeys__climbing"
      aria-labelledby="climbing-label"
    >
      <SectionLabel
        id="climbing-label"
        class="journeys__label"
      >
        Climbing now
      </SectionLabel>
      <JourneyListItem
        v-for="row in climbing"
        :key="row.journey.id"
        :row="row"
      />
      <p
        v-if="loadFailed"
        class="journeys__empty"
        role="alert"
      >
        Couldn’t load your journeys. Reload the page to try again.
      </p>
      <p
        v-else-if="!climbing.length"
        class="journeys__empty"
      >
        Nothing in progress. Start a journey to change one thing on purpose and see what it does to how you feel.
      </p>
    </section>

    <AttemptBars
      v-for="item in retried"
      :key="item.journey.id"
      :name="item.journey.name"
      :bars="item.bars"
    />

    <PastJourneys
      v-if="past.length"
      :rows="past"
    />
  </div>
</template>
