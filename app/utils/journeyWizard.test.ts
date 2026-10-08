import { describe, expect, it } from 'vitest'
import { EXAMPLE_WHAT, parseRules, plannedCheckpoints, wizardFloors } from './journeyWizard'

describe('parseRules', () => {
  it('reads the example into remove and allow rules', () => {
    const { rules, name } = parseRules(EXAMPLE_WHAT)
    expect(name).toBe('Nicotine-free')
    expect(rules.filter(r => r.kind === 'remove').map(r => r.label)).toEqual(['Nicotine', 'TikTok', 'YouTube Shorts', 'Gambling', 'Vaping'])
    expect(rules.filter(r => r.kind === 'allow').map(r => r.label)).toEqual(['Long-form YouTube', 'Games', 'Coffee'])
    expect(rules.filter(r => r.suggested).map(r => r.label)).toEqual(['Vaping', 'Coffee'])
  })

  it('keeps "after work" on allowed things in the same sentence', () => {
    expect(parseRules('No alcohol. Music is fine after work.').rules).toEqual([
      { kind: 'remove', label: 'Alcohol', suggested: false },
      { kind: 'allow', label: 'Music after work', suggested: false },
    ])
  })

  it('falls back to the first sentence and a plain name', () => {
    expect(parseRules('Walk every morning. Even in rain.')).toEqual({
      rules: [{ kind: 'remove', label: 'Walk every morning', suggested: false }],
      name: 'Walk every morning-free',
    })
    expect(parseRules('   ')).toEqual({ rules: [], name: 'New journey' })
  })
})

describe('wizardFloors', () => {
  it('lists the floors up to the length, keeping day 1 and the summit', () => {
    const floors = wizardFloors(30, [3, 30], [{ kind: 'remove', label: 'Nicotine', suggested: false }])
    expect(floors.map(f => [f.title, f.roman, f.on, f.fixed])).toEqual([
      ['Day 1', 'I', true, true], ['Day 3', 'II', false, false], ['Day 7', 'III', true, false],
      ['Day 14', 'IV', true, false], ['Summit', 'SUMMIT', true, true],
    ])
    expect(floors[1]!.expectation).toMatch(/^Days 2–3 are commonly reported/)
    expect(floors.at(-1)!.expectation).toBe('30 days. Compare how you feel now with the 30 days before Day 1.')
    expect(plannedCheckpoints(floors)).toEqual([1, 7, 14, 30])
  })

  it('uses general wording without nicotine and the plain summit text at 90 days', () => {
    const floors = wizardFloors(90, [], [])
    expect(floors).toHaveLength(7)
    expect(floors[0]!.expectation).toBe('The change is most visible today. Log how it feels, even briefly.')
    expect(floors.at(-1)!.expectation).toBe('Look back at how you felt before you started.')
  })
})
