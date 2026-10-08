<script setup lang="ts">
import type { JourneyRule, SetbackOutcome } from '~/types/journey'
import { attemptView } from '~/utils/analytics/journeyDetail'
import { dayKey } from '~/utils/date'
import { currentAttempt } from '~/utils/journey'

const DAY_MS = 86_400_000

const route = useRoute()
const now = useNow()
const timeZone = useTimezone()
const { journeys, loadFailed, recordSetback, replaceRules } = useJourneys()
const { fetchRange } = useMoodHistory()

const id = String(route.params.id)
const journey = computed(() => journeys.value.find(j => j.id === id))
// A failed load (by the layout) isn't a missing journey.
if (loadFailed.value) {
  throw createError({ statusCode: 503, statusMessage: 'Couldn’t load your journeys' })
}
if (!journey.value || !currentAttempt(journey.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Journey not found' })
}

useHead({ title: () => journey.value?.name ?? 'Journey' })

// The page shows the current (latest) attempt.
const view = computed(() => attemptView(journey.value!, currentAttempt(journey.value!)!, now.value))
const attemptId = computed(() => view.value.attempt.id)

// Check-ins from 30 days before the attempt began until now (or its end).
const { data: entries } = await useAsyncData(
  `journey-entries:${id}`,
  () => fetchRange(dayKey(view.value.startMs - 30 * DAY_MS, timeZone.value), dayKey(view.value.atMs, timeZone.value), timeZone.value),
  { watch: [attemptId] },
)
const between = (from: number, to: number) => (entries.value ?? []).filter((e) => {
  const at = Date.parse(e.loggedAt)
  return at >= from && at < to
})
const before = computed(() => between(view.value.startMs - 30 * DAY_MS, view.value.startMs))
const during = computed(() => between(view.value.startMs, view.value.atMs + 1))

// ── Setback and rules (not in the design; PLAN.md Q6) ─────────────────
const panel = ref<'setback' | 'rules' | null>(null)
const saving = ref(false)
const error = ref('')
const notice = ref('')

function open(which: 'setback' | 'rules') {
  panel.value = which
  error.value = ''
  notice.value = ''
}

function close() {
  panel.value = null
  error.value = ''
}

async function record(outcome: SetbackOutcome, note: string) {
  const { day, attempt } = view.value
  saving.value = true
  error.value = ''
  try {
    await recordSetback(id, note, outcome)
    close()
    notice.value = outcome === 'continued'
      ? `Setback recorded. Day ${day} stays Day ${day}.`
      : `Attempt #${attempt.number + 1} has begun. Attempt #${attempt.number} stays in your history.`
  }
  catch {
    error.value = 'Couldn’t record the setback. Nothing changed, so try again.'
  }
  finally {
    saving.value = false
  }
}

async function saveRules(rules: JourneyRule[]) {
  saving.value = true
  error.value = ''
  try {
    await replaceRules(id, rules)
    close()
    notice.value = 'Rules updated.'
  }
  catch {
    error.value = 'Couldn’t save the rules. Nothing changed, so try again.'
  }
  finally {
    saving.value = false
  }
}

const note = computed(() => notice.value || (view.value.active
  ? 'A setback is recorded, not reset. Your climb stays.'
  : `This attempt has ended. Your climb to Day ${view.value.day} stays in your history.`))

useHotkeys({
  // Esc leaves a field first, then closes the panel.
  escape: () => {
    const active = document.activeElement
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) active.blur()
    else if (panel.value && !saving.value) close()
  },
})
</script>

<template>
  <div class="page page--journey">
    <JourneyDetailView
      :view="view"
      :during="during"
      :before="before"
      :time-zone="timeZone"
    >
      <template #actions>
        <SetbackPanel
          v-if="panel === 'setback'"
          :day="view.day"
          :next-attempt="view.attempt.number + 1"
          :saving="saving"
          :error="error"
          @record="record"
          @cancel="close"
        />
        <RulesEditor
          v-else-if="panel === 'rules'"
          :rules="view.journey.rules"
          :saving="saving"
          :error="error"
          @save="saveRules"
          @cancel="close"
        />
        <div
          v-else
          class="journey-actions"
        >
          <template v-if="view.active">
            <BaseButton
              variant="outline"
              @click="open('setback')"
            >
              Record a setback
            </BaseButton>
            <BaseButton
              class="journey-actions__edit"
              variant="ghost"
              @click="open('rules')"
            >
              Edit rules
            </BaseButton>
          </template>
          <span
            class="journey-actions__note"
            role="status"
          >{{ note }}</span>
        </div>
      </template>
    </JourneyDetailView>
  </div>
</template>
