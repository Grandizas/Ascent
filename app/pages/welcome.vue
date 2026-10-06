<script setup lang="ts">
import type { MoodEntry } from '~/types/mood'
import { formatTime } from '~/utils/date'
import { getMood, type MoodLevel } from '~/utils/mood'

// First run after signup: the whole habit in one tap.
definePageMeta({ layout: 'auth' })
useHead({ title: 'Welcome' })

const timeZone = useTimezone()
const { firstName, load } = useProfile()
const { entries, addEntry, updateEntry, syncError } = useMoodEntries()

await useAsyncData('profile', () => load())

// Derived from the store, so a failed (rolled-back) save stops showing as logged.
const loggedId = ref<string | null>(null)
const logged = computed<MoodEntry | null>(() => entries.value.find(e => e.id === loggedId.value) ?? null)

async function pick(level: MoodLevel) {
  const score = getMood(level).defaultScore
  if (logged.value) await updateEntry(logged.value.id, { level, score })
  else loggedId.value = (await addEntry({ level, score })).id
}

const title = computed(() => `How do you feel right now${firstName.value ? `, ${firstName.value}` : ''}?`)
</script>

<template>
  <div class="auth-page auth-page--compact">
    <AuthIntro
      eyebrow="Account created"
      tone="success"
      :title="title"
      description="This is the whole habit: one tap whenever your mood shifts. It's your first data point."
    />

    <MoodPicker
      variant="compact"
      :selected="logged?.level"
      @pick="pick"
    />

    <p
      v-if="syncError"
      class="auth-form__error"
      role="alert"
    >
      {{ syncError }}
    </p>

    <div
      v-if="logged"
      class="welcome__logged"
    >
      <p class="welcome__line">
        <MoodDot
          :color="getMood(logged.level).color"
          glow
        />
        Logged at {{ formatTime(logged.loggedAt, timeZone) }}. That took about two seconds.
      </p>
      <BaseButton
        to="/"
        variant="primary"
        size="3xl"
        block
      >
        Go to Today
      </BaseButton>
    </div>
    <NuxtLink
      v-else
      to="/"
      class="welcome__skip"
    >
      Skip for now
    </NuxtLink>
  </div>
</template>
