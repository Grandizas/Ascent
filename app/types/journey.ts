/** Minimal journey shape the shell needs. Extended in phase 6. */
export interface JourneySummary {
  id: string
  name: string
  /** Current day of the active attempt (1-based). */
  day: number
  /** Dot color in lists (any CSS color). */
  color: string
}
