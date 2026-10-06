// Temporary mood history until Supabase lands (phase 3). Built relative to
// "today" in the user's timezone so the app always has a believable day.
import type { MoodEntry } from '~/types/mood'
import { addDays, dayKey, minuteOfDay, zonedDate } from '~/utils/date'
import { levelFromScore, type MoodLevel } from '~/utils/mood'

interface SeedEntry {
  min: number
  level: MoodLevel
  score: number
  note: string
  tags: string[]
}

// Today's entries from the design (Today.dc.html).
const TODAY: SeedEntry[] = [
  { min: 514, level: 3, score: 5, note: 'Didn’t sleep particularly well.', tags: ['Tired'] },
  { min: 612, level: 2, score: 4, note: 'Can’t concentrate at work. Kept thinking about buying a pouch.', tags: ['Work', 'Nicotine craving'] },
  { min: 767, level: 1, score: 3, note: 'Craving hit hard after lunch. Walked around the block instead.', tags: ['Nicotine craving', 'Outside'] },
  { min: 920, level: 3, score: 5, note: 'Craving disappeared. Back in focus.', tags: ['Work', 'Caffeine'] },
  { min: 1093, level: 4, score: 7, note: 'Gym felt great.', tags: ['Gym'] },
  { min: 1182, level: 4, score: 8, note: 'Relaxed after a couple of hours of Valheim.', tags: ['Gaming', 'Alone'] },
]

// Yesterday's curve from the design (the dashed "Yesterday" line).
const YESTERDAY: [min: number, score: number][] = [[470, 5], [630, 4], [790, 4], [1000, 6], [1160, 7], [1350, 7]]

const NOTES = [
  'Gym felt great.',
  'Didn’t sleep particularly well.',
  'Long meeting, drained afterwards.',
  'Walked outside for a bit. Helped.',
  'Quiet evening, read for an hour.',
  'Craving after lunch, passed quickly.',
]
const TAGS = ['Work', 'Gym', 'Gaming', 'Tired', 'Good sleep', 'Social', 'Alone', 'Outside', 'Caffeine', 'Bored']

// Deterministic PRNG (same family as the design's mock generator).
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildMoodFixture(now: number, timeZone: string): MoodEntry[] {
  const today = dayKey(now, timeZone)
  const nowMinute = minuteOfDay(now, timeZone)
  const entries: MoodEntry[] = []

  const push = (key: string, id: string, e: SeedEntry) => entries.push({
    id,
    loggedAt: zonedDate(key, e.min, timeZone).toISOString(),
    level: e.level,
    score: e.score,
    note: e.note,
    tags: e.tags,
  })

  // Only the part of "today" that has already happened.
  TODAY.filter(e => e.min <= nowMinute).forEach((e, i) => push(today, `fx-0-${i}`, e))

  const yesterday = addDays(today, -1)
  YESTERDAY.forEach(([min, score], i) =>
    push(yesterday, `fx-1-${i}`, { min, score, level: levelFromScore(score), note: '', tags: [] }))

  const rand = mulberry32(7)
  for (let offset = 2; offset < 30; offset++) {
    const key = addDays(today, -offset)
    const count = 3 + Math.floor(rand() * 3)
    const base = 4.2 + rand() * 2.4
    const minutes = Array.from({ length: count }, () => 450 + Math.floor(rand() * 960)).sort((a, b) => a - b)
    minutes.forEach((min, i) => {
      const score = Math.max(1, Math.min(10, Math.round(base + (rand() - 0.5) * 4)))
      const hasNote = rand() < 0.5
      push(key, `fx-${offset}-${i}`, {
        min,
        score,
        level: levelFromScore(score),
        note: hasNote ? NOTES[Math.floor(rand() * NOTES.length)]! : '',
        tags: rand() < 0.7 ? [TAGS[Math.floor(rand() * TAGS.length)]!] : [],
      })
    })
  }

  return entries.sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
}

/** Static until the Insights engine exists (phase 8). */
export const todayObservationFixture = {
  text: 'Since Day 1, your lowest entries have clustered between 10:00 and 13:00, and 5 of those 7 mention a craving. Evenings after the gym have tended to score higher.',
  caption: 'Observation from 61 entries · a pattern, not a proven cause',
}
