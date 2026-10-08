// "Start a journey" wizard: rule suggestions from the user's own words and the
// floor plan of step 4. Pure functions.

import type { JourneyRule } from '~/types/journey'
import { CHECKPOINT_DAYS, floorRoman } from '~/utils/journey'

export const EXAMPLE_WHAT = 'I\'m quitting nicotine completely. I also don\'t want TikTok, Shorts or gambling. Games and normal YouTube can stay, but only after work.'
export const EXAMPLE_WHY = 'I don\'t want something external controlling whether I can concentrate or feel normal. I want to know what my baseline feels like.'

// ── Rules ─────────────────────────────────────────────────────────────
// The design's local reader: known things and "allowed" cues, sentence by
// sentence. A placeholder until rules are suggested server-side (phase 10);
// the UI only depends on `suggestRules`.
const DICTIONARY: readonly [RegExp, string][] = [
  [/nicotine|snus|pouch/, 'Nicotine'], [/vap(e|ing)/, 'Vaping'], [/cigarette|smok/, 'Smoking'], [/tik ?tok/, 'TikTok'], [/shorts/, 'YouTube Shorts'],
  [/reels|instagram/, 'Instagram'], [/gambl|betting|casino/, 'Gambling'], [/(normal|long[- ]form)?\s*youtube(?!\s*shorts)/, 'Long-form YouTube'],
  [/\bgam(es|ing)\b/, 'Games'], [/coffee/, 'Coffee'], [/caffeine/, 'Caffeine'], [/alcohol|drinking|beer|wine/, 'Alcohol'], [/music/, 'Music'],
  [/social media/, 'Social media'], [/sugar|sweets/, 'Sugar'], [/netflix|series|tv\b/, 'TV & series'], [/weed|cannabis/, 'Cannabis'],
]
const ALLOW_CUES = /can stay|allowed|is fine|are fine|okay|\bok\b|still|keep/

export interface RuleSuggestion {
  rules: JourneyRule[]
  /** A starting name for step 4 ("Nicotine-free"). */
  name: string
}

/** Reads `what` into remove/allow rules, adding a couple of common companions marked "suggested". */
export function parseRules(what: string): RuleSuggestion {
  const remove: JourneyRule[] = []
  const allow: JourneyRule[] = []
  const seen = new Set<string>()
  for (const sentence of what.split(/(?<=[.!?;])\s+|,\s*but\s+/i)) {
    const s = sentence.toLowerCase()
    const allowed = ALLOW_CUES.test(s)
    const afterWork = /after work/.test(s)
    for (const [pattern, label] of DICTIONARY) {
      if (!pattern.test(s) || seen.has(label)) continue
      seen.add(label)
      if (allowed) allow.push({ kind: 'allow', label: afterWork ? `${label} after work` : label, suggested: false })
      else remove.push({ kind: 'remove', label, suggested: false })
    }
  }
  if (seen.has('Nicotine') && !seen.has('Coffee') && !seen.has('Caffeine')) allow.push({ kind: 'allow', label: 'Coffee', suggested: true })
  if (seen.has('Nicotine') && !seen.has('Vaping')) remove.push({ kind: 'remove', label: 'Vaping', suggested: true })
  if (!remove.length && !allow.length) {
    const first = what.split(/[.!?]/)[0]!.trim().slice(0, 40)
    if (first) remove.push({ kind: 'remove', label: first, suggested: false })
  }
  const name = seen.has('Nicotine') ? 'Nicotine-free' : remove[0] ? `${remove[0].label.replace(/ after work$/, '')}-free` : 'New journey'
  return { rules: [...remove, ...allow], name }
}

/** Rule suggestions for step 3. Async so a server-side reader can replace the local one. */
export async function suggestRules(what: string): Promise<RuleSuggestion> {
  return parseRules(what)
}

// ── Floors ────────────────────────────────────────────────────────────
// "What people often report" per floor, worded as possibilities (design copy).
const EXPECT_NICOTINE = [
  'Often the most noticeable day. Restlessness and distraction are common.',
  'Days 2–3 are commonly reported as the most irritable. Sleep and focus may be off.',
  'Cravings may still be frequent, though many people find them getting shorter.',
  'Cravings may become less frequent, though sudden urges can still happen.',
  'Many report steadier focus around a month. Your entries will say for sure.',
  'Urges tend to attach to specific situations rather than the clock.',
  'Compare how you feel now with the 30 days before Day 1.',
] as const
const EXPECT_GENERAL = [
  'The change is most visible today. Log how it feels, even briefly.',
  'Early days often feel the strangest. Noticing is enough.',
  'A week is where habits start to show their shape.',
  'Two weeks in, many people find the new pattern feels less effortful.',
  'A month gives you enough entries to compare with before.',
  'By now the change may feel ordinary. That is a result too.',
  'Look back at how you felt before you started.',
] as const

export interface WizardFloor {
  day: number
  /** "Day 7", or "Summit" for the last floor. */
  title: string
  /** "III" or "SUMMIT". */
  roman: string
  expectation: string
  /** Kept in the plan. */
  on: boolean
  /** Day 1 and the summit can't be skipped. */
  fixed: boolean
}

/** Step 4's floors for a length, with `skipped` days switched off. */
export function wizardFloors(lengthDays: number, skipped: readonly number[], rules: readonly JourneyRule[]): WizardFloor[] {
  const expectations = rules.some(r => /nicotine/i.test(r.label)) ? EXPECT_NICOTINE : EXPECT_GENERAL
  const days = CHECKPOINT_DAYS.filter(d => d <= lengthDays)
  return days.map((day, index) => {
    const last = day === lengthDays
    const fixed = day === 1 || last
    return {
      day,
      title: last ? 'Summit' : `Day ${day}`,
      roman: floorRoman(index, last),
      expectation: last && lengthDays !== 90 ? `${lengthDays} days. ${expectations[6]}` : expectations[index]!,
      on: fixed || !skipped.includes(day),
      fixed,
    }
  })
}

/** The checkpoint days kept in the plan. */
export const plannedCheckpoints = (floors: readonly WizardFloor[]): number[] => floors.filter(f => f.on).map(f => f.day)
