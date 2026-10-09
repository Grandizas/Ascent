<script setup lang="ts">
import type { JourneyRule, RuleKind } from '~/types/journey'

const props = defineProps<{
  kind: RuleKind
  /** Every rule of the journey; this column shows its own kind. */
  rules: readonly JourneyRule[]
}>()

const emit = defineEmits<{
  flip: [index: number]
  delete: [index: number]
  add: [label: string]
}>()

const COPY = {
  remove: { title: 'Remove', flip: 'arrow-right', flipTo: 'allowed', placeholder: '+ Add something to remove' },
  allow: { title: 'Allowed', flip: 'arrow-left', flipTo: 'remove', placeholder: '+ Add something allowed' },
} as const

const copy = computed(() => COPY[props.kind])
// Keep each rule's index in the full list so events address the right one.
const items = computed(() => props.rules.map((rule, index) => ({ rule, index })).filter(({ rule }) => rule.kind === props.kind))

const draft = ref('')
function add() {
  if (!draft.value.trim()) return
  emit('add', draft.value)
  draft.value = ''
}
</script>

<template>
  <div
    class="rule-column"
    :class="`rule-column--${kind}`"
  >
    <div class="rule-column__head">
      <h2 class="rule-column__title">
        {{ copy.title }}
      </h2>
      <span class="rule-column__count">{{ items.length }}</span>
    </div>
    <ul class="rule-column__list">
      <li
        v-for="{ rule, index } in items"
        :key="`${index}:${rule.label}`"
        class="rule-column__rule"
      >
        <span
          class="rule-column__dot"
          aria-hidden="true"
        />
        <span class="rule-column__label">{{ rule.label }}</span>
        <span
          v-if="rule.suggested"
          class="rule-column__suggested"
        >suggested</span>
        <button
          type="button"
          class="rule-column__action"
          :title="`Move to ${copy.flipTo}`"
          :aria-label="`Move ${rule.label} to ${copy.flipTo}`"
          @click="emit('flip', index)"
        >
          <AppIcon :name="copy.flip" />
        </button>
        <button
          type="button"
          class="rule-column__action rule-column__action--delete"
          title="Remove rule"
          :aria-label="`Remove ${rule.label}`"
          @click="emit('delete', index)"
        >
          <AppIcon name="close" />
        </button>
      </li>
    </ul>
    <input
      v-model="draft"
      class="rule-column__add"
      :placeholder="copy.placeholder"
      :aria-label="copy.placeholder.slice(2)"
      maxlength="80"
      @keydown.enter.prevent="add"
    >
  </div>
</template>
