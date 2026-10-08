<script setup lang="ts">
import { evidenceLevel, evidenceText, type Notice } from '~/utils/analytics/insights'

defineProps<{ notices: readonly Notice[] }>()
</script>

<template>
  <section
    class="notices"
    aria-labelledby="notices-label"
  >
    <SectionLabel
      id="notices-label"
      class="notices__label"
    >
      Worth noticing
    </SectionLabel>
    <div
      v-for="notice in notices"
      :key="notice.text"
      class="notices__notice"
    >
      <Diamond class="notices__marker" />
      <div class="notices__body">
        <p class="notices__text">
          {{ notice.text }}
        </p>
        <span class="notices__evidence">
          <EvidenceMeter :level="evidenceLevel(notice.entries)" />
          {{ evidenceText(notice.entries) }}
        </span>
      </div>
    </div>
    <p
      v-if="!notices.length"
      class="notices__empty"
    >
      Nothing stands out yet. Patterns show up here as your check-ins build.
    </p>
  </section>
</template>
