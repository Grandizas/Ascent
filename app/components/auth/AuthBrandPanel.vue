<template>
  <aside class="auth-brand">
    <AppBrand class="auth-brand__logo" />

    <!-- Decorative: a short climb with Day 1 lit, future floors fading upward. -->
    <div
      class="auth-brand__ladder"
      aria-hidden="true"
    >
      <span class="auth-brand__glow" />
      <span class="auth-brand__ring auth-brand__ring--far" />
      <span class="auth-brand__pill auth-brand__pill--far" />
      <span class="auth-brand__ring auth-brand__ring--near" />
      <span class="auth-brand__pill auth-brand__pill--near" />
      <span class="auth-brand__orb">Day 1</span>
      <span class="auth-brand__stem" />
    </div>
    <span
      class="auth-brand__fade"
      aria-hidden="true"
    />

    <div class="auth-brand__copy">
      <p class="auth-brand__quote">
        Evidence about yourself, collected two seconds at a time.
      </p>
      <p class="auth-brand__sub">
        Log how you feel, change one thing on purpose, and see what actually happens.
      </p>
    </div>
  </aside>
</template>
