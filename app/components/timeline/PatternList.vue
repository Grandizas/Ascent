<script setup lang="ts">
defineProps<{ items: readonly string[] }>()
</script>

<template>
  <section
    class="pattern-list"
    aria-labelledby="pattern-list-label"
  >
    <SectionLabel
      id="pattern-list-label"
      class="pattern-list__label"
    >
      Patterns in this period
    </SectionLabel>
    <p
      v-for="item in items"
      :key="item"
      class="pattern-list__item"
    >
      <Diamond class="pattern-list__marker" />
      <span>{{ item }}</span>
    </p>
    <p class="pattern-list__footnote">
      Associations in your own entries, not proven causes.
    </p>
  </section>
</template>
