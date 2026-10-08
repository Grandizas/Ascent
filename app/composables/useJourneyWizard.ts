import { EXAMPLE_WHAT, EXAMPLE_WHY, plannedCheckpoints, suggestRules, wizardFloors } from '~/utils/journeyWizard'

export const WIZARD_STEPS = ['What', 'Why', 'Rules', 'Floors'] as const

/** State of the "Start a journey" wizard (local to the page). */
export function useJourneyWizard() {
  const step = ref(1)
  const what = ref('')
  const why = ref('')
  const { rules, flipRule, deleteRule, addRule } = useRuleList()
  const reading = ref(false)
  const name = ref('')
  const lengthDays = ref(90)
  const skipped = ref<number[]>([])
  // The text the current rules were read from; edits survive going back unless it changes.
  let readFrom: string | null = null

  const floors = computed(() => wizardFloors(lengthDays.value, skipped.value, rules.value))
  const checkpoints = computed(() => plannedCheckpoints(floors.value))

  const canContinue = computed(() => what.value.trim() !== '')
  const canSuggest = computed(() => why.value.trim() !== '')
  const canBegin = computed(() => name.value.trim() !== '' && !reading.value)

  function useExampleWhat() {
    what.value = EXAMPLE_WHAT
  }

  function useExampleWhy() {
    why.value = EXAMPLE_WHY
  }

  function toWhy() {
    if (canContinue.value) step.value = 2
  }

  async function toRules() {
    if (!canSuggest.value) return
    step.value = 3
    const text = what.value.trim()
    if (text === readFrom) return
    reading.value = true
    try {
      const suggestion = await suggestRules(text)
      rules.value = suggestion.rules
      if (!name.value.trim()) name.value = suggestion.name
      readFrom = text
    }
    finally {
      reading.value = false
    }
  }

  function toFloors() {
    if (!reading.value) step.value = 4
  }

  function back() {
    step.value = Math.max(1, step.value - 1)
  }

  function toggleFloor(day: number) {
    skipped.value = skipped.value.includes(day) ? skipped.value.filter(d => d !== day) : [...skipped.value, day]
  }

  return {
    step, what, why, rules, reading, name, lengthDays, floors, checkpoints,
    canContinue, canSuggest, canBegin,
    useExampleWhat, useExampleWhy, toWhy, toRules, toFloors, back,
    flipRule, deleteRule, addRule, toggleFloor,
  }
}
