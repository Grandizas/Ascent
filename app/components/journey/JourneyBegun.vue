<script setup lang="ts">
defineProps<{
  name: string
  why: string
  /** "today at 14:03". */
  started: string
  /** The first floor after Day 1. */
  nextFloor: number
}>()
</script>

<template>
  <section
    class="journey-begun"
    aria-labelledby="journey-begun-title"
  >
    <span
      class="journey-orb journey-begun__orb"
      aria-hidden="true"
    />
    <span class="journey-begun__eyebrow">Day 1 · Floor I</span>
    <h1
      id="journey-begun-title"
      class="journey-begun__title"
    >
      {{ name }}
    </h1>
    <p class="journey-begun__meta">
      Started {{ started }}. The next floor opens on Day {{ nextFloor }}.
    </p>
    <p class="journey-begun__why">
      “{{ why }}”
    </p>
    <div class="journey-begun__actions">
      <BaseButton
        variant="primary"
        size="lg"
        to="/journeys"
      >
        Back to journeys
      </BaseButton>
      <BaseButton
        class="journey-begun__log"
        variant="outline"
        size="lg"
        to="/"
      >
        Log how you feel
      </BaseButton>
    </div>
  </section>
</template>
