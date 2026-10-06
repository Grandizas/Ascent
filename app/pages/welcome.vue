<script setup lang="ts">
import type { MoodEntry } from '~/types/mood'
import { formatTime } from '~/utils/date'
import { getMood, type MoodLevel } from '~/utils/mood'

// First run after signup: the whole habit in one tap.
definePageMeta({ layout: 'auth' })
useHead({ title: 'Welcome' })

const timeZone = useTimezone()
const { firstName, load } = useProfile()
const { addEntry, updateEntry } = useMoodEntries()

await useAsyncData('profile', () => load())

const logged = ref<MoodEntry | null>(null)

async function pick(level: MoodLevel) {
  const score = getMood(level).defaultScore
  if (logged.value) {
    logged.value = { ...logged.value, level, score }
    await updateEntry(logged.value.id, { level, score })
  }
  else {
    logged.value = await addEntry({ level, score })
  }
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
