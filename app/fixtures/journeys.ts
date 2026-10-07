// Temporary journey history until journeys land (phase 6). Dates are relative
// to "today" so Timeline lanes always have something plausible to show; the
// set mirrors the design's sample journeys.
import type { JourneySpan } from '~/types/journey'
import { addDays, type DayKey } from '~/utils/date'

export function journeyHistoryFixture(today: DayKey): JourneySpan[] {
  const day = (offset: number) => addDays(today, -offset)
  return [
    { id: 'dopamine-detox', name: 'Dopamine detox', start: day(700), end: day(693), status: 'stopped', statusLabel: 'Stopped at day 8' },
    { id: 'gym-consistency', name: 'Gym consistency', start: day(640), end: day(581), status: 'completed', statusLabel: 'Completed · 60 days' },
    { id: 'read-every-day', name: 'Read every day', start: day(401), end: day(312), status: 'completed', statusLabel: 'Completed · 90 days' },
    { id: 'no-social-media', name: 'No social media', start: day(120), end: day(91), status: 'completed', statusLabel: 'Completed · 30 days' },
    { id: 'nicotine-free-1', name: 'Nicotine-free · #1', start: day(53), end: day(50), status: 'setback', statusLabel: '4 days · setback' },
    { id: 'nicotine-free', name: 'Nicotine-free · #2', start: day(11), end: null, status: 'active', statusLabel: 'Day 12 · active' },
    { id: 'fix-sleep-schedule', name: 'Fix sleep schedule', start: day(4), end: null, status: 'active', statusLabel: 'Day 5 · active' },
  ]
}
