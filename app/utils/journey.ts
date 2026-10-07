// Journey constants and naming shared by Timeline and Journal. Grows in phase 6.

/** Days a journey checkpoint ("floor") is reached on. Day 1 is the ground floor. */
export const CHECKPOINT_DAYS: readonly number[] = [1, 3, 7, 14, 30, 60, 90]

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'] as const

/** "the third floor" for the checkpoint at `index` in CHECKPOINT_DAYS. */
export function floorName(index: number): string {
  return `the ${ORDINALS[index] ?? `${index + 1}th`} floor`
}

// Attempt labels follow the design's lane names: "Nicotine-free · #2".
const ATTEMPT_SUFFIX = / · #(\d+)$/

/** The journey's name without the attempt suffix ("Nicotine-free"). */
export function journeyBaseName(name: string): string {
  return name.replace(ATTEMPT_SUFFIX, '')
}

/** The attempt number from a "Name · #N" label, or null. */
export function journeyAttempt(name: string): number | null {
  const match = ATTEMPT_SUFFIX.exec(name)
  return match ? Number(match[1]) : null
}
