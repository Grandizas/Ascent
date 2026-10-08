<script setup lang="ts">
import { formatTime } from '~/utils/date'
import { climbingJourneys, JOURNEY_LENGTHS, nextJourneyColor } from '~/utils/journey'

useHead({ title: 'New journey' })

const timeZone = useTimezone()
const { journeys, create } = useJourneys()
const {
  step, what, why, rules, reading, name, lengthDays, floors, checkpoints,
  canContinue, canSuggest, canBegin,
  useExampleWhat, useExampleWhy, toWhy, toRules, toFloors, back,
  flipRule, deleteRule, addRule, toggleFloor,
} = useJourneyWizard()

const LENGTHS = JOURNEY_LENGTHS.map(days => ({ value: days, label: `${days} days` }))

// ── Writing steps get the cursor, as in the design ────────────────────
const whatField = useTemplateRef<HTMLTextAreaElement>('whatField')
const whyField = useTemplateRef<HTMLTextAreaElement>('whyField')

function focusStep() {
  if (step.value === 1) whatField.value?.focus()
  if (step.value === 2) whyField.value?.focus()
}
onMounted(focusStep)
watch(step, () => nextTick(focusStep))

// ── Begin ─────────────────────────────────────────────────────────────
const saving = ref(false)
const error = ref('')
const begun = ref<{ name: string, why: string, started: string, nextFloor: number } | null>(null)

async function begin() {
  if (!canBegin.value || saving.value) return
  saving.value = true
  error.value = ''
  try {
    const used = climbingJourneys(journeys.value, Date.now()).map(j => j.color)
    const id = await create({
      name: name.value,
      what: what.value,
      why: why.value,
      lengthDays: lengthDays.value,
      checkpoints: checkpoints.value,
      color: nextJourneyColor(used),
      rules: rules.value,
    })
    const startedAt = journeys.value.find(j => j.id === id)?.attempts[0]?.startedAt ?? new Date().toISOString()
    begun.value = {
      name: name.value.trim(),
      why: why.value.trim(),
      started: `today at ${formatTime(startedAt, timeZone.value)}`,
      nextFloor: checkpoints.value.find(d => d > 1) ?? lengthDays.value,
    }
  }
  catch {
    error.value = 'Couldn’t start the journey. Nothing was saved, so try again.'
  }
  finally {
    saving.value = false
  }
}

useHotkeys({
  // Esc leaves a field first, then the wizard.
  escape: () => {
    const active = document.activeElement
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) active.blur()
    else navigateTo('/journeys')
  },
})
</script>

<template>
  <JourneyBegun
    v-if="begun"
    :name="begun.name"
    :why="begun.why"
    :started="begun.started"
    :next-floor="begun.nextFloor"
  />

  <div
    v-else
    class="page page--wizard wizard"
  >
    <div class="wizard__top">
      <Breadcrumb
        :trail="[{ label: 'Journeys', to: '/journeys' }]"
        current="New journey"
      />
      <Stepper
        :steps="WIZARD_STEPS"
        :current="step"
        label="Steps"
      />
    </div>

    <WizardStep
      v-if="step === 1"
      :step="1"
      title="What are you changing?"
      description="Say it in your own words, including what's still allowed. Rules come next, and you'll approve every one."
    >
      <textarea
        ref="whatField"
        v-model="what"
        class="wizard-textarea"
        rows="6"
        maxlength="2000"
        aria-label="What are you changing?"
        placeholder="I'm quitting nicotine completely. I also don't want TikTok, Shorts or gambling. Games and normal YouTube can stay, but only after work."
      />
      <template #actions>
        <button
          type="button"
          class="wizard__link is-underlined"
          @click="useExampleWhat"
        >
          Use the example
        </button>
        <BaseButton
          variant="primary"
          size="xl"
          :disabled="!canContinue"
          @click="toWhy"
        >
          Continue
        </BaseButton>
      </template>
    </WizardStep>

    <WizardStep
      v-else-if="step === 2"
      :step="2"
      title="Why are you doing this?"
      description="Write it for the version of you on a hard day. You'll see these words again at every floor and after any setback."
    >
      <textarea
        ref="whyField"
        v-model="why"
        class="wizard-textarea wizard-textarea--why"
        rows="5"
        maxlength="2000"
        aria-label="Why are you doing this?"
        placeholder="I don't want something external controlling whether I can concentrate or feel normal. I want to know what my baseline feels like."
      />
      <template #actions>
        <span class="wizard__links">
          <button
            type="button"
            class="wizard__link"
            @click="back"
          >
            ← Back
          </button>
          <button
            type="button"
            class="wizard__link is-underlined"
            @click="useExampleWhy"
          >
            Use the example
          </button>
        </span>
        <BaseButton
          variant="primary"
          size="xl"
          :disabled="!canSuggest"
          @click="toRules"
        >
          Suggest rules
        </BaseButton>
      </template>
    </WizardStep>

    <WizardStep
      v-else-if="step === 3"
      :step="3"
      title="Here's how I read it"
      spacing="loose"
    >
      <blockquote class="wizard__quote">
        {{ what }}
      </blockquote>
      <p
        v-if="reading"
        class="wizard__reading"
        role="status"
      >
        Reading what you wrote…
      </p>
      <template v-else>
        <div class="wizard__rules">
          <RuleColumn
            kind="remove"
            :rules="rules"
            @flip="flipRule"
            @delete="deleteRule"
            @add="addRule('remove', $event)"
          />
          <RuleColumn
            kind="allow"
            :rules="rules"
            @flip="flipRule"
            @delete="deleteRule"
            @add="addRule('allow', $event)"
          />
        </div>
        <p class="wizard__note">
          “Suggested” items weren't in your text. Keep them only if they're true for you.
        </p>
      </template>
      <template #actions>
        <button
          type="button"
          class="wizard__link"
          @click="back"
        >
          ← Back
        </button>
        <BaseButton
          variant="primary"
          size="xl"
          :disabled="reading"
          @click="toFloors"
        >
          Approve rules
        </BaseButton>
      </template>
    </WizardStep>

    <WizardStep
      v-else
      :step="4"
      title="The floors of your tower"
      spacing="loose"
    >
      <div class="wizard__settings">
        <label class="wizard__field">
          <span class="wizard__field-label">Name</span>
          <input
            v-model="name"
            class="wizard__name"
            maxlength="80"
          >
        </label>
        <div class="wizard__field">
          <span class="wizard__field-label">Length</span>
          <SegmentedControl
            v-model="lengthDays"
            :options="LENGTHS"
            label="Length"
            variant="mono-lg"
          />
        </div>
      </div>
      <FloorPlan
        :floors="floors"
        @toggle="toggleFloor"
      />
      <p class="wizard__note wizard__note--wide">
        These describe what people often report, as possibilities, not promises. At each floor you'll see them next to what your own entries say.
      </p>
      <p
        v-if="error"
        class="wizard__error"
        role="alert"
      >
        {{ error }}
      </p>
      <template #actions>
        <button
          type="button"
          class="wizard__link"
          @click="back"
        >
          ← Back
        </button>
        <BaseButton
          variant="sage"
          size="2xl"
          :disabled="!canBegin"
          :loading="saving"
          @click="begin"
        >
          Begin at Floor I
        </BaseButton>
      </template>
    </WizardStep>
  </div>
</template>
