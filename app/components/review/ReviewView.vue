<script setup lang="ts">
import { type ReviewModel, reviewSubtitle } from '~/utils/analytics/review'
import type { DayKey } from '~/utils/date'
import { moodColorContinuous } from '~/utils/mood'

const props = defineProps<{
  model: ReviewModel
  /** Years with check-ins, oldest first. */
  years: readonly number[]
  today: DayKey
}>()

const year = defineModel<number>('year', { required: true })

const currentYear = computed(() => Number(props.today.slice(0, 4)))
const yearOptions = computed(() => props.years.map(y => ({ value: y, label: y === currentYear.value ? `${y} · so far` : String(y) })))
const counts = computed(() => [
  { value: props.model.counts.checkIns, label: 'mood check-ins' },
  { value: props.model.counts.notes, label: 'notes written' },
  { value: props.model.counts.journeys, label: 'journeys' },
  { value: props.model.counts.completed, label: 'completed journeys' },
])
const tagTone = (difference: number) => (difference >= 0.2 ? 'is-positive' : difference <= -0.2 ? 'is-negative' : '')
const signed = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`
</script>

<template>
  <div class="page page--review review">
    <section
      class="review-hero"
      aria-labelledby="review-year"
    >
      <div class="review-hero__top">
        <span class="review-hero__eyebrow">Year in review</span>
        <SegmentedControl
          v-if="yearOptions.length > 1"
          v-model="year"
          :options="yearOptions"
          label="Year"
        />
      </div>
      <div class="review-hero__title">
        <h1
          id="review-year"
          class="review-hero__year"
        >
          {{ model.year }}
        </h1>
        <span class="review-hero__subtitle">{{ reviewSubtitle(model.year, today, model.partial) }}</span>
      </div>
      <div class="review-hero__counts">
        <div
          v-for="count in counts"
          :key="count.label"
          class="review-hero__count"
        >
          <span class="review-hero__count-value">{{ count.value.toLocaleString('en-GB') }}</span>
          <span class="review-hero__count-label">{{ count.label }}</span>
        </div>
      </div>
    </section>

    <template v-if="model.counts.checkIns">
      <section class="review__section review__section--arc">
        <SectionHeader
          label="Mood through the year"
          :title="model.arcTitle"
          :title-size="30"
        />
        <YearArcChart
          :weeks="model.weeks"
          :months="model.months"
          :average="model.average"
          :best="model.best"
          :hardest="model.hardest"
          :lanes="model.lanes"
        />
      </section>

      <section
        v-if="model.superlatives.length"
        class="review-supers"
        aria-label="The year at a glance"
      >
        <div
          v-for="item in model.superlatives"
          :key="item.key"
          class="review-supers__item"
        >
          <span class="review-supers__key">{{ item.key }}</span>
          <span class="review-supers__value">
            <span
              class="review-supers__dot"
              :style="{ background: item.color }"
              aria-hidden="true"
            />
            {{ item.value }}
            <template v-if="item.to">
              <AppIcon
                class="review-supers__arrow"
                name="arrow-right"
                label="to"
              />
              {{ item.to }}
            </template>
          </span>
          <span class="review-supers__sub">{{ item.sub }}</span>
        </div>
      </section>

      <section class="review__section">
        <SectionHeader
          label="Month by month"
          title="Twelve months, side by side"
          :title-size="30"
        />
        <div class="review-months">
          <div
            v-for="m in model.months"
            :key="m.month"
            class="review-months__month"
            :class="{ 'is-empty': !m.entries }"
          >
            <div class="review-months__head">
              <span class="review-months__name">{{ m.short }}</span>
              <span class="review-months__average">{{ m.average === null ? '—' : m.average.toFixed(1) }}</span>
            </div>
            <span
              class="review-months__bars"
              aria-hidden="true"
            >
              <span
                v-for="(value, i) in m.days"
                :key="i"
                class="review-months__bar"
                :style="{ height: `${3 + ((value - 2) / 7) * 23}px`, background: moodColorContinuous(value) }"
              />
            </span>
            <span
              class="review-months__label"
              :class="`is-${m.tone}`"
            >{{ m.label }}</span>
          </div>
        </div>
      </section>

      <section
        v-if="model.moments.length"
        class="review-moments"
        aria-labelledby="review-moments-title"
      >
        <SectionLabel class="review-moments__label">
          Moments worth keeping
        </SectionLabel>
        <h2
          id="review-moments-title"
          class="section-header__title section-header__title--30 review-moments__title"
        >
          In your own words
        </h2>
        <div
          v-for="moment in model.moments"
          :key="moment.id"
          class="review-moments__moment"
        >
          <div class="review-moments__when">
            <span class="review-moments__date">{{ moment.date }}</span>
            <span class="review-moments__score">
              <MoodDot :level="moment.level" />
              {{ moment.score }}/10
            </span>
          </div>
          <div class="review-moments__body">
            <span class="review-moments__note">“{{ moment.note }}”</span>
            <span class="review-moments__context">{{ moment.context }}</span>
          </div>
        </div>
      </section>

      <section class="review-lists">
        <div class="review-lists__list">
          <SectionLabel class="review-lists__label">
            Most frequent tags
          </SectionLabel>
          <div
            v-for="tag in model.tags"
            :key="tag.tag"
            class="review-tags__row"
          >
            <span class="review-tags__name">
              #{{ tag.tag }}
              <span
                class="review-tags__bar"
                :style="{ width: `${tag.width * 100}%` }"
              />
            </span>
            <span class="review-tags__count">{{ tag.count }}</span>
            <span
              class="review-tags__difference"
              :class="tagTone(tag.difference)"
            >{{ signed(tag.difference) }}</span>
          </div>
          <span class="review-lists__note">Right: mood when tagged, against your yearly average.</span>
        </div>
        <div class="review-lists__list">
          <SectionLabel class="review-lists__label">
            Journeys this year
          </SectionLabel>
          <div
            v-for="journey in model.journeys"
            :key="journey.id"
            class="review-journeys__row"
          >
            <span class="review-journeys__title">
              <span class="review-journeys__name">{{ journey.name }}</span>
              <span class="review-journeys__dates">{{ journey.dates }}</span>
            </span>
            <span
              class="review-journeys__status"
              :class="`is-${journey.tone}`"
            >{{ journey.status }}</span>
          </div>
          <span
            v-if="!model.journeys.length"
            class="review-journeys__empty"
          >No journeys this year.</span>
        </div>
      </section>

      <section
        v-if="model.reflection.length"
        class="review-reflection"
        aria-labelledby="review-reflection-label"
      >
        <SectionLabel id="review-reflection-label">
          A short reflection · written from your entries
        </SectionLabel>
        <p
          v-for="paragraph in model.reflection"
          :key="paragraph"
          class="review-reflection__paragraph"
        >
          {{ paragraph }}
        </p>
        <span class="review-reflection__note">Drawn from patterns in your check-ins and notes. These are associations, not conclusions, and you know the context better than the data does.</span>
      </section>
    </template>

    <p
      v-else
      class="review__empty"
    >
      No check-ins in {{ model.year }} yet. Your year fills in as you log how you feel.
    </p>
  </div>
</template>
