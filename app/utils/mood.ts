// Mood scale shared by every page. Colors mirror `$moods` in abstracts/_tokens.scss.

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface Mood {
  level: MoodLevel
  label: string
  color: string
  /** Intensity (1–10) pre-selected when this mood is tapped. */
  defaultScore: number
}

export const MOODS: readonly Mood[] = [
  { level: 1, label: 'Sad', color: 'oklch(0.58 0.075 262)', defaultScore: 2 },
  { level: 2, label: 'Low', color: 'oklch(0.64 0.06 232)', defaultScore: 4 },
  { level: 3, label: 'Neutral', color: 'oklch(0.72 0.018 85)', defaultScore: 5 },
  { level: 4, label: 'Good', color: 'oklch(0.77 0.085 78)', defaultScore: 7 },
  { level: 5, label: 'Great', color: 'oklch(0.83 0.105 68)', defaultScore: 9 },
]

/** Context tags offered by default, in the order the design shows them. */
export const DEFAULT_TAGS: readonly string[] = [
  'Work', 'Gaming', 'Gym', 'Nicotine craving', 'Tired', 'Good sleep',
  'Social', 'Alone', 'Outside', 'Caffeine', 'Bored',
]

export function getMood(level: MoodLevel): Mood {
  return MOODS[level - 1]!
}

/** Mood level implied by a 1–10 score (used where only a score is known, e.g. averages). */
export function levelFromScore(score: number): MoodLevel {
  if (score <= 2) return 1
  if (score <= 4) return 2
  if (score <= 6) return 3
  if (score <= 8) return 4
  return 5
}

// [score, L, C, H] anchors for the continuous scale. Darker than MOODS on purpose:
// used for averages, heatmap cells and month bars.
const CONTINUOUS_ANCHORS: readonly [number, number, number, number][] = [
  [2, 0.50, 0.075, 262],
  [4, 0.58, 0.06, 232],
  [5.5, 0.66, 0.018, 85],
  [7.5, 0.74, 0.085, 78],
  [9, 0.82, 0.105, 68],
]

/** Continuous mood color for an average value, interpolated in OKLCH and clamped at both ends. */
export function moodColorContinuous(value: number): string {
  const first = CONTINUOUS_ANCHORS[0]!
  const last = CONTINUOUS_ANCHORS[CONTINUOUS_ANCHORS.length - 1]!
  const v = Math.min(last[0], Math.max(first[0], value))

  let lo = first
  let hi = last
  for (let i = 0; i < CONTINUOUS_ANCHORS.length - 1; i++) {
    const a = CONTINUOUS_ANCHORS[i]!
    const b = CONTINUOUS_ANCHORS[i + 1]!
    if (v >= a[0] && v <= b[0]) {
      lo = a
      hi = b
      break
    }
  }

  const t = hi[0] === lo[0] ? 0 : (v - lo[0]) / (hi[0] - lo[0])
  const mix = (i: 1 | 2 | 3) => lo[i] + (hi[i] - lo[i]) * t
  return `oklch(${mix(1).toFixed(3)} ${mix(2).toFixed(3)} ${mix(3).toFixed(1)})`
}
