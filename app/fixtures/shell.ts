// Temporary data for the shell until Supabase lands (phase 3 / phase 6).
// Mirrors the design's sample user and active journeys.
import type { JourneySummary } from '~/types/journey'
import type { Profile } from '~/types/profile'

export const profileFixture: Profile = {
  displayName: 'Alex Moreau',
  memberSince: '2024-03-04',
}

export const activeJourneysFixture: JourneySummary[] = [
  { id: 'nicotine-free', name: 'Nicotine-free', day: 12, color: 'oklch(0.83 0.1 72)' },
  { id: 'fix-sleep-schedule', name: 'Fix sleep schedule', day: 5, color: 'oklch(0.64 0.06 232)' },
]
