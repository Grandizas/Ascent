import type { JourneyRule, RuleKind } from '~/types/journey'

/** An editable remove/allowed rule list (the wizard's step 3 and "Edit rules"). */
export function useRuleList(initial: readonly JourneyRule[] = []) {
  const rules = ref<JourneyRule[]>(initial.map(r => ({ ...r })))

  /** Moves a rule to the other column; it's the user's own choice from then on. */
  function flipRule(index: number) {
    rules.value = rules.value.map((rule, i) => (i === index ? { ...rule, kind: rule.kind === 'remove' ? 'allow' : 'remove', suggested: false } : rule))
  }

  function deleteRule(index: number) {
    rules.value = rules.value.filter((_, i) => i !== index)
  }

  /** Adds a rule unless the column already has it. */
  function addRule(kind: RuleKind, label: string) {
    const text = label.trim().slice(0, 80)
    if (!text || rules.value.some(r => r.kind === kind && r.label.toLowerCase() === text.toLowerCase())) return
    rules.value = [...rules.value, { kind, label: text, suggested: false }]
  }

  return { rules, flipRule, deleteRule, addRule }
}
