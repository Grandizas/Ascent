<script setup lang="ts">
import type { JourneyRule } from '~/types/journey'

// Not in the design: the wizard's rule columns (step 3) with Save / Cancel.
const props = defineProps<{
  rules: readonly JourneyRule[]
  saving?: boolean
  error?: string
}>()

const emit = defineEmits<{ save: [rules: JourneyRule[]], cancel: [] }>()

const { rules: draft, flipRule, deleteRule, addRule } = useRuleList(props.rules)
</script>

<template>
  <BaseCard
    class="journey-panel"
    aria-labelledby="rules-title"
  >
    <span
      id="rules-title"
      class="journey-section__label"
    >Edit rules</span>
    <div class="wizard__rules">
      <RuleColumn
        kind="remove"
        :rules="draft"
        @flip="flipRule"
        @delete="deleteRule"
        @add="addRule('remove', $event)"
      />
      <RuleColumn
        kind="allow"
        :rules="draft"
        @flip="flipRule"
        @delete="deleteRule"
        @add="addRule('allow', $event)"
      />
    </div>
    <p
      v-if="error"
      class="journey-panel__error"
      role="alert"
    >
      {{ error }}
    </p>
    <div class="journey-panel__actions">
      <BaseButton
        size="sm"
        :disabled="saving"
        @click="emit('cancel')"
      >
        Cancel
      </BaseButton>
      <BaseButton
        variant="primary"
        size="sm"
        :loading="saving"
        @click="emit('save', draft)"
      >
        Save rules
      </BaseButton>
    </div>
  </BaseCard>
</template>
