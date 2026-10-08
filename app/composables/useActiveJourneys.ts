import { climbingJourneys, journeySummary } from '~/utils/journey'

/** Journeys currently being climbed, longest-running first (sidebar list, composer label). */
export function useActiveJourneys() {
  const { journeys } = useJourneys()
  const now = useNow()
  return computed(() => climbingJourneys(journeys.value, now.value).map(j => journeySummary(j, now.value)))
}
