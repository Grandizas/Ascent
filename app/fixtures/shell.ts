// Temporary data for the shell until journeys land (phase 6).
// Mirrors the design's sample active journeys.
import type { JourneySummary } from '~/types/journey'

export const activeJourneysFixture: JourneySummary[] = [
  { id: 'nicotine-free', name: 'Nicotine-free', day: 12, color: 'oklch(0.83 0.1 72)' },
  { id: 'fix-sleep-schedule', name: 'Fix sleep schedule', day: 5, color: 'oklch(0.64 0.06 232)' },
]
