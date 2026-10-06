<script setup lang="ts">
// Placeholder until phase 2 (Today). Exists so the scaffold renders a route.
useHead({ title: 'Today · baseline' })
</script>

<template>
  <main class="scaffold">
    <p class="scaffold__note">
      <AppIcon name="check" /> Scaffold ready. Shell arrives in phase 1.
    </p>
  </main>
</template>

<style lang="scss" scoped>
// Temporary: removed with this page in phase 1.
.scaffold {
  padding: 30px 44px;

  @include respond-to(mobile) {
    padding: 18px 16px;
  }
}

.scaffold__note {
  margin: 0;
  font-family: $font-mono;
  color: $color-text;
}
</style>
