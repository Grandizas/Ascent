<script setup lang="ts">
// Not in the design (PLAN.md Q6): Settings is extrapolated from the wizard and
// journey pages: a mono label, a serif title, then hairline-separated rows.
defineProps<{
  label: string
  title: string
  description?: string
}>()

const id = useId()
</script>

<template>
  <section
    class="settings-section"
    :aria-labelledby="id"
  >
    <div class="settings-section__head">
      <SectionLabel>{{ label }}</SectionLabel>
      <h2
        :id="id"
        class="section-header__title section-header__title--22"
      >
        {{ title }}
      </h2>
      <p
        v-if="description"
        class="section-header__description"
      >
        {{ description }}
      </p>
    </div>
    <BaseCard
      pad="none"
      class="settings-section__rows"
    >
      <slot />
    </BaseCard>
  </section>
</template>
