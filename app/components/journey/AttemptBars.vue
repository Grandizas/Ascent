<script setup lang="ts">
import { type AttemptBar, attemptsSummary } from '~/utils/journey'

const props = defineProps<{
  name: string
  bars: readonly AttemptBar[]
}>()

const summary = computed(() => attemptsSummary(props.bars))
</script>

<template>
  <section class="attempts">
    <SectionHeader
      :label="`${name} · Attempts`"
      title="Every attempt counts"
      :title-size="26"
    />
    <div class="attempts__list">
      <div
        v-for="bar in bars"
        :key="bar.number"
        class="attempts__row"
        :class="{ 'is-active': bar.active }"
      >
        <span class="attempts__number">Attempt #{{ bar.number }}</span>
        <span class="attempts__track">
          <span
            class="attempts__bar"
            :style="{ width: `${bar.width * 100}%` }"
          />
          <span class="attempts__label">{{ bar.label }}</span>
        </span>
      </div>
    </div>
    <p
      v-if="summary"
      class="attempts__summary"
    >
      {{ summary }}
    </p>
  </section>
</template>
