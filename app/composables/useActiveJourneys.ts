import { activeJourneysFixture } from '~/fixtures/shell'

/** Journeys currently being climbed (sidebar list). Backed by a fixture until phase 6. */
export function useActiveJourneys() {
  return useState('active-journeys', () => activeJourneysFixture)
}
